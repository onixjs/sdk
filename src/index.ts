import {OnixClientConfig, RuntimeEnvironment} from './interfaces';
import {HTTP} from './core/http';
import {AppReference} from './core/reference';
import {WS} from './core/websocket';
export * from './interfaces';
export * from './core/reference';
/**
 * @class OnixClient
 * @author Jonathan Casarrubias <gh: mean-expert-official>
 * @license MIT
 * @description This class provides core functionality for
 * client applications.
 */
export class OnixClient {
  private _http: HTTP.HTTPBrowserClient | HTTP.HTTPNodeClient;
  private _ws:
    | (new (url: string) => WS.WSBrowserClient)
    | (new (url: string) => WS.WSNodeClient);
  private _schema: any = {}; // TODO Interface Schema
  private _references: {[key: string]: any} = {}; // Todo Reference Interface
  /**
   * @constructor
   * @param config
   * @description Receives a client configuration, it will
   * also define a default value for our config incase is not
   * provided.
   */
  constructor(
    private config: OnixClientConfig = {
      host: 'http://localhost',
      port: 3000,
      runtime: RuntimeEnvironment.NODE_JS,
    },
  ) {
    // Setup the right http client
    switch (this.config.runtime) {
      case RuntimeEnvironment.NODE_JS:
        this._ws = WS.WSNodeClient;
        this._http = new HTTP.HTTPNodeClient();
        break;
      case RuntimeEnvironment.BROWSER:
        this._ws = WS.WSBrowserClient;
        this._http = new HTTP.HTTPBrowserClient();
        break;
      default:
        throw new Error('Unable to get a suitable HTTP client');
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
        this._references[name] = new AppReference(
          Object.assign({name, client: this._ws}, this._schema[name]),
        );
        await this._references[name].connect();
      }
      resolve(this._references[name]);
    });
  }
}
