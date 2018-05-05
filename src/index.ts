import {
  OnixClientConfig,
  IWS,
  IAppOperation,
  IHTTP,
  IAppRefConfig,
  ILocalStorage,
  IOperationListener,
  IClaims,
} from './interfaces';
import {AppReference} from './core/app.reference';
import {Utils} from './utils';
export * from './core';
export * from './interfaces';
/**
 * @class OnixClient
 * @author Jonathan Casarrubias <gh: mean-expert-official>
 * @license MIT
 * @description This class provides core functionality for
 * client applications.
 */
export class OnixClient {
  private index: number = 0;
  private _ws: IWS;
  private _http: IHTTP;
  private _storage: ILocalStorage;
  private _schema: any = {}; // TODO Interface Schema
  private _references: {[key: string]: any} = {}; // Todo Reference Interface
  private listeners: {[key: number]: ((operation: IAppOperation) => void)} = {};
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
      this._http = new this.config.adapters.http();
      this._ws = new this.config.adapters.websocket();
      this._storage = new this.config.adapters.storage();
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
      this._schema = await this._http.get(
        `${this.config.host}:${this.config.port}/.well-known/onixjs-schema`,
      );
      // URL
      const url: string = `${
        this.config.port === 443 ? 'wss' : 'ws'
      }://${this.config.host.replace(/http[s]{0,1}:\/\//, '')}:${
        this.config.port
      }`;
      // Connect WebSocket
      this._ws.connect(url);
      // Register Single WS Listener
      this._ws.on('message', (data: string) => {
        Object.keys(this.listeners)
          .map(key => this.listeners[key])
          .forEach((listener: (data: IAppOperation) => void) =>
            listener(
              Utils.IsJsonString(data) ? JSON.parse(<string>data) : data,
            ),
          );
      });
      // When connection is open then resolve
      this._ws.open(() => resolve());
    });
  }
  /**
   * @method disconnect
   * @description Disconnect from websocket server
   */
  public disconnect(): void {
    this._ws.close();
  }
  /**
   * @class AppReference
   * @param name
   * @description This method will construct an application reference.
   * Only if the provided schema defines it does exist.
   */
  public async AppReference(name: string): Promise<AppReference | Error> {
    // Verify that the application actually exists on server
    if (!this._schema[name]) {
      return new Error(
        `ONIX Client: Application with ${name} doesn't exist on the OnixJS Server Environment.`,
      );
    }
    // If the reference still doesn't exist, then create one
    if (!this._references[name]) {
      // Use passed host config if any
      this._references[name] = new AppReference(<IAppRefConfig>Object.assign(
        {
          name,
          client: this._ws,
          token: this.token,
          claims: await this.claims(),
          addListener: (listener: IOperationListener): number =>
            this.addListener(listener),
          removeListener: (id: number): boolean => this.removeListener(id),
        },
        this._schema[name],
      ));
    }
    // Otherwise return a singleton instance of the reference
    return this._references[name];
  }
  /**
   * @method addListener
   * @param listener
   * @description This method will register application operation listeners.
   * TODO PRIVATIZE
   */
  addListener(listener: IOperationListener): number {
    this.index += 1;
    this.listeners[this.index] = listener;
    return this.index;
  }
  /**
   * @method removeListener
   * @param listener
   * @description This method will unload application operation listeners
   */
  removeListener(id: number): boolean {
    if (this.listeners[id]) {
      delete this.listeners[id];
      return true;
    } else {
      return false;
    }
  }
  /**
   * @description This setter will store a provided access token
   * into the local storage adapter.
   */
  set token(token: string) {
    this._storage.setItem(`${this.config.prefix}:access_token`, token);
  }
  /**
   * @description This getter will return a stored access token
   * from the local storage adapter.
   */
  get token(): string {
    return this._storage.getItem(`${this.config.prefix}:access_token`) || '';
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
    const persisted: string | null = this._storage.getItem(
      `${this.config.prefix}:claims`,
    );
    // Verify that we already have an actual claims
    if (persisted) {
      return <IClaims>JSON.parse(persisted);
    }
    // Otherwise verify we actually have an access_token
    if (this.token.length > 0) {
      // Now call from the SSO the user claims
      const claims = <IClaims>await this._http.get(
        `https://sso.onixjs.io/me?access_token=${this.token}`,
      );
      // Store now in localstorage
      this._storage.setItem(
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
    this._storage.clear();
  }
}
