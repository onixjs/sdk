import {
  OnixClientConfig,
  IWS,
  IAppOperation,
  IHTTP,
  IAppRefConfig,
} from './interfaces';
import {AppReference} from './core';
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
    if (this.config.adapters.http && this.config.adapters.websocket) {
      this._http = new this.config.adapters.http();
      this._ws = new this.config.adapters.websocket();
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
      console.log('SCHEMA ', this._schema);
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
   * @class AppReference
   * @param name
   * @description This method will construct an application reference.
   * Only if the provided schema defines it does exist.
   */
  public AppReference(name: string): AppReference | Error {
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
          addListener: (listener: (operation: IAppOperation) => void): number =>
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
   * @description This method will register application operation listeners
   */
  addListener(listener: (operation: IAppOperation) => void): number {
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
}
