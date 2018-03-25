import {OnixClientConfig, IHTTP} from './interfaces';
import {AppReference} from './core';
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
  private _http: IHTTP;
  private _schema: any = {}; // TODO Interface Schema
  private _references: {[key: string]: any} = {}; // Todo Reference Interface
  /**
   * @constructor
   * @param config
   * @description Receives a client configuration, it will
   * also define a default value for our config incase is not
   * provided.
   */
  constructor(private config: OnixClientConfig) {
    if (this.config.adapters.websocket && this.config.adapters.websocket) {
      this._http = new this.config.adapters.http();
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
    return new Promise<boolean>(async (resolve, reject) => {
      this._schema = await this._http.get(
        `${this.config.host}:${this.config.port}`,
      );
      resolve();
    });
  }

  public async AppReference(name: string): Promise<AppReference | Error> {
    return new Promise<AppReference | Error>(async (resolve, reject) => {
      if (!this._schema[name]) {
        reject(
          new Error(
            `ONIX Client: Application with ${name} doesn't exist on the OnixJS Server Environment.`,
          ),
        );
      }
      if (!this._references[name]) {
        // Use passed host config if any
        this._schema[name].host = this.config.host.replace(
          /http[s]{0,1}:\/\//,
          '',
        );
        this._references[name] = new AppReference(
          Object.assign(
            {name, client: new this.config.adapters.websocket()},
            this._schema[name],
          ),
        );
        await this._references[name].connect();
      }
      resolve(this._references[name]);
    });
  }
}
