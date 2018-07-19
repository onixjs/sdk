import {
  OnixClientConfig,
  IWS,
  IHTTP,
  IAppRefConfig,
  ILocalStorage,
  IClaims,
  IAppOperation,
} from './interfaces';
import {AppReference} from './core/app.reference';
import {Utils} from './utils';
import {ListenerCollection} from './core/listener.collection';
import {ClientRegistration} from './core/client.registration';
import {OperationType} from './enums';
export * from './core';
export * from './enums';
export * from './interfaces';
export const namespace = 'onixjs:sdk';
/**
 * @class OnixClient
 * @author Jonathan Casarrubias <gh: mean-expert-official>
 * @license MIT
 * @description This class provides core functionality for
 * client applications.
 */
export class OnixClient {
  private ws: IWS;
  private http: IHTTP;
  private storage: ILocalStorage;
  private listeners: ListenerCollection = new ListenerCollection();
  private schema: any = {}; // TODO Interface Schema
  private references: {[key: string]: any} = {}; // Todo Reference Interface
  protected registration: ClientRegistration;
  /**
   * @constructor
   * @param config
   * @description Receives a client configuration, it will
   * also define a default value for our config incase is not
   * provided.
   */
  constructor(private config: OnixClientConfig) {
    if (
      this.config.adapters.http &&
      this.config.adapters.websocket &&
      this.config.adapters.storage
    ) {
      this.http = new this.config.adapters.http();
      this.ws = new this.config.adapters.websocket();
      this.storage = new this.config.adapters.storage();
      // Set some default configs
      if (!this.config.prefix) {
        this.config.prefix = namespace;
      }
      if (!this.config.intervals) {
        this.config.intervals = {};
      }
      if (!this.config.intervals.ping) {
        this.config.intervals.ping = 5000;
      }
      if (!this.config.intervals.timeout) {
        this.config.intervals.timeout = 1000;
      }
      if (!this.config.intervals.reconnect) {
        this.config.intervals.reconnect = 5000;
      }
      if (!this.config.attempts) {
        this.config.attempts = {};
      }
      if (!this.config.attempts!.ping) {
        this.config.attempts!.ping = 3;
      }
    } else {
      console.log('ONIXJS SDK: Unable to find suitable adapters.');
    }
  }
  /**
   * @method init
   * @description this method will get the onix infrastructure schema
   * in order to correctly configure each Application Reference.
   */
  public async init() {
    try {
      // Get OnixJS Schema
      this.schema = await this.http.get(
        `${this.config.host}:${this.config.port}/.well-known/onixjs-schema`,
      );
      // Connect
      return this.connect();
    } catch (e) {
      const error = new Error(
        `${namespace} Unable to get host schema, verify internet connection and/or sdk host:port configs.`,
      );
      this.disconnected(error);
      throw error;
    }
  }
  /**
   * @method onDisconnect
   * @param handler
   * @description This method must be used to handle disconnections.
   * Any reference must be destroyed and re-created when the client
   * is connected again.
   */
  public onDisconnect(handler) {
    this.listeners.namespace('disconnect').add(e => {
      handler(4);
    });
  }
  /**
   * @method reconnect
   * @param handler
   * @description This method must be used to handle re-connections.
   * Any reference must be destroyed and re-created when the client
   * is connected again.
   */
  public reconnect(handler) {
    this.listeners.namespace('reconnect').add(handler);
  }
  /**
   * @method connect
   * @description This method will be internally used to handle ws connection
   * on init or under unexpected disconnections.
   */
  private async connect() {
    return new Promise<boolean>((resolve, reject) => {
      // URL
      const url: string = `${
        this.config.port === 443 ? 'wss' : 'ws'
      }://${this.config.host.replace(/http[s]{0,1}:\/\//, '')}:${
        this.config.port
      }`;
      // Connect WebSocket
      this.ws.connect(url);
      // Register Single WS Listener
      this.ws.on('message', (data: string) =>
        this.listeners
          .namespace('remote')
          .broadcast(Utils.IsJsonString(data) ? JSON.parse(data) : data),
      );
      // When connection is open then register and resolve
      this.ws.open(() =>
        // Wait until the connection is valid
        this.waitForConnection(() => {
          // Set a ping interval process
          const id = setInterval(
            () => this.ping(id),
            this.config.intervals!.ping!,
          );
          // Register current connection
          this.register(resolve, reject);
        }),
      );
      // Handle error disconnections
      this.ws.on('close', (e: any) => {
        switch (e.code) {
          case 1000: // CLOSE_NORMAL
            console.log('WebSocket: closed');
            break;
          default:
            // Abnormal closure
            this.disconnected(e);
            this.onclose(e);
            break;
        }
      });
      // Handle close disconnections
      this.ws.on('error', (e: any) => {
        switch (e.code) {
          case 'ECONNREFUSED':
            this.disconnected(e);
            break;
          default:
            this.onerror(e);
            break;
        }
      });
    });
  }
  /**
   * @method disconnected
   * @param e
   * @description This method will notify disconnections. When notifying
   * the subscribers, they must dispose subscriptions and run the sdk
   * initialization again.
   */
  private disconnected(e) {
    // Remove any websocket listener
    if (this.ws && this.ws.client && this.ws.removeAllListeners)
      this.ws.removeAllListeners();
    // Wait some time before notifying the
    // disconnection.
    // Will notify the disconnect listeners
    // the client implementing the SDK should
    // notify users there is a disconnection
    this.listeners.namespace('disconnect').broadcast(e);
    this.listeners.removeNameSpaceListeners('remote');
    this.references = {};
    setTimeout(() => {
      // Will notify the reconnect listeners
      // the client implementing the SDK should
      // Call the init method again
      this.listeners.namespace('reconnect').broadcast(e);
    }, this.config.intervals!.reconnect!);
  }
  /**
   * @method onerror
   * @param e
   * @description This method will log errored disconnections
   */
  private onerror(e) {
    console.log('WebSocketClient: error', arguments);
  }
  /**
   * @method onclose
   * @param e
   * @description This method will log close disconnections
   */
  private onclose(e) {
    console.log('WebSocketClient: closed', arguments);
  }
  /**
   * @method
   * @param resolve
   */
  private register(resolve, reject) {
    const uuid: string = Utils.uuid();
    // Register Client
    const operation: IAppOperation = {
      uuid,
      type: OperationType.ONIX_REMOTE_REGISTER_CLIENT,
      message: {
        rpc: 'register',
        request: {
          metadata: {
            stream: false,
            register: uuid,
          },
          payload: {},
        },
      },
    };
    // Create listener
    const index: number = this.listeners
      .namespace('remote')
      .add((data: IAppOperation | string) => {
        // Verify we actually get an object
        const response: IAppOperation = <IAppOperation>(typeof data ===
          'string' && Utils.IsJsonString(data)
          ? JSON.parse(data)
          : data);
        // Verify we got the result, which will provide the registration
        // Later might be used on handled disconnections.
        if (
          response.uuid === operation.uuid &&
          response.type === OperationType.ONIX_REMOTE_REGISTER_CLIENT_RESPONSE
        ) {
          if (
            response.message.request.payload.code &&
            response.message.request.payload.message
          ) {
            reject(response.message.request.payload);
          } else {
            this.registration = new ClientRegistration(uuid);
            this.listeners.remove(index);
            resolve();
          }
        }
      });
    // Send registration operation
    this.ws.send(JSON.stringify(operation));
  }
  /**
   * @method ping
   */
  private ping(id) {
    const ts: string = Math.round(new Date().getTime() / 1000).toString();
    let to: number = 0;
    // set timeout interval
    const interval = setInterval(() => {
      if (to >= this.config.attempts!.ping!) {
        this.disconnect();
        clearInterval(id);
        clearInterval(interval);
      }
      to += 1;
    }, this.config.intervals!.timeout);

    const index: number = this.listeners
      .namespace('remote')
      .add((data: IAppOperation | number | string) => {
        if (
          (typeof data === 'number' && data.toString().includes(ts)) ||
          (typeof data === 'string' && data.includes(ts))
        ) {
          to = 0;
          this.listeners.namespace('remote').remove(index);
          clearInterval(interval);
        }
      });
    // Send timestamp
    this.ws.send(ts);
  }
  /**
   * @method disconnect
   * @description Disconnect from websocket server
   */
  public disconnect(): void {
    this.disconnected('CLOSED');
    this.ws.close();
  }
  /**
   * @class AppReference
   * @param name
   * @description This method will construct an application reference.
   * Only if the provided schema defines it does exist.
   */
  public async AppReference(name: string): Promise<AppReference> {
    // Verify that the application actually exists on server
    if (!this.schema[name]) {
      throw new Error(
        `${namespace} Application with ${name} doesn't exist on the OnixJS Server Environment.`,
      );
    }
    // If the reference still doesn't exist, then create one
    if (!this.references[name]) {
      // Use passed host config if any
      this.references[name] = new AppReference(
        Object.assign(
          <IAppRefConfig>{
            name,
            client: this.ws,
            token: this.token,
            claims: await this.claims(),
            listeners: this.listeners,
            registration: () => this.registration,
          },
          this.schema[name],
        ),
      );
    }
    // Otherwise return a singleton instance of the reference
    return this.references[name];
  }
  /**
   * @description This setter will store a provided access token
   * into the local storage adapter.
   */
  set token(token: string) {
    this.storage.setItem(`${this.config.prefix}:access_token`, token);
  }
  /**
   * @description This getter will return a stored access token
   * from the local storage adapter.
   */
  get token(): string {
    return this.storage.getItem(`${this.config.prefix}:access_token`) || '';
  }
  /**
   * @method claims
   * @param organization
   * @author Jonathan Casarrubias
   * @description This method will return an OIDC claims object.
   * Usually will provide the user information and any scope
   * defined within the OIDC Client.
   *
   * Organization param is optional and is created to allow devs
   * to claim user organization groups -if scoped-
   */
  async claims(organization?: string): Promise<IClaims> {
    // Load claims from local storage
    const persisted: string | null = this.storage.getItem(
      `${this.config.prefix}:claims`,
    );
    // Verify that we already have an actual claims
    if (persisted) {
      return <IClaims>JSON.parse(persisted);
    }
    // Otherwise verify we actually have an access_token
    if (this.token.length > 0) {
      // Now call from the SSO the user claims
      const claims = <IClaims>await this.http.get(
        `https://sso.onixjs.io/me?access_token=${this.token}${
          organization ? `&organization=${organization}` : ''
        }`,
      );
      // Store now in localstorage
      this.setClaims(claims);
      // Return the claims
      return claims;
    } else {
      // This guy is not even logged, return an anonymous claim
      return {sub: '$anonymous'};
    }
  }
  /**
   * @method setClaims
   * @description This method will directly set the claims from a user
   * without calling the SSO.
   *
   * This is an advanced method and must be avoided in most of the cases,
   * though it is public, should only be used in edge cases.
   */
  setClaims(claims) {
    // Store now in localstorage
    this.storage.setItem(
      `${this.config.prefix}:claims`,
      JSON.stringify(claims),
    );
  }

  waitForConnection(callback, interval = 100) {
    if (this.ws.client.readyState === 1) {
      callback();
    } else {
      // optional: implement backoff for interval here
      setTimeout(() => {
        this.waitForConnection(callback, interval);
      }, interval);
    }
  }
  /**
   * @method logout
   * @description this method will clear the local storage, therefore
   * cleaning any stored information like token or claims.
   */
  logout(): void {
    this.storage.clear();
  }
}
