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
      if (!this.config.prefix) {
        this.config.prefix = 'onixjs.sdk';
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
  public async init(): Promise<boolean> {
    return new Promise<any>(async (resolve, reject) => {
      // Get OnixJS Schema
      this.schema = await this.http.get(
        `${this.config.host}:${this.config.port}/.well-known/onixjs-schema`,
      );
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
        this.listeners.broadcast(
          Utils.IsJsonString(data) ? JSON.parse(data) : data,
        ),
      );
      // When connection is open then register and resolve
      this.ws.open(() => this.register(resolve, reject));
    });
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
            subscription: uuid,
          },
          payload: {},
        },
      },
    };
    // Create listener
    const index: number = this.listeners.add((data: IAppOperation | string) => {
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
   * @method disconnect
   * @description Disconnect from websocket server
   */
  public disconnect(): void {
    this.ws.close();
  }
  /**
   * @class AppReference
   * @param name
   * @description This method will construct an application reference.
   * Only if the provided schema defines it does exist.
   */
  public async AppReference(name: string): Promise<AppReference | Error> {
    // Verify that the application actually exists on server
    if (!this.schema[name]) {
      return new Error(
        `ONIX Client: Application with ${name} doesn't exist on the OnixJS Server Environment.`,
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
            registration: this.registration,
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
   * @author Jonathan Casarrubias
   * @description This method will return an OIDC claims object.
   * Usually will provide the user information and any scope
   * defined within the OIDC Client.
   */
  async claims(): Promise<IClaims> {
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
        `https://sso.onixjs.io/me?access_token=${this.token}`,
      );
      // Store now in localstorage
      this.storage.setItem(
        `${this.config.prefix}:claims`,
        JSON.stringify(claims),
      );
      // Return the claims
      return claims;
    } else {
      // This guy is not even logged, return an anonymous claim
      return {sub: '$anonymous'};
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
