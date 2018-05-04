import {IWS, IHTTP, ILocalStorage} from '../interfaces';
const appSettings = require('application-settings');
require('nativescript-websockets');
const WS = WebSocket;
const http = require('http');
/**
 * @namespace Nativescript
 * @author Miguel Serrano
 * @description This namespace will provide adapters for the
 * SDK to work in a Nativescript environment,
 */
export namespace Nativescript {
  /**
   * @class WebSocket
   * @author Miguel Serrano
   * @description This class is used when the SDK is running in a
   * Nativescript Environment.
   */
  export class WebSocket implements IWS {
    private connection;
    connect(url: string) {
      this.connection = new WS(url, []);
    }
    on(name: string, callback) {
      switch (name) {
        case 'message':
          this.connection.addEventListener(name, evt => {
            callback(evt.data);
          });
          break;
        default:
          throw new Error(
            `ONIX Client: WebSocket event ${name} is not implemented.`,
          );
      }
    }
    send(something: string) {
      this.connection.send(something);
    }
    open(callback) {
      this.connection.addEventListener('open', callback);
    }
  }
  /**
   * @class HTTP
   * @author Miguel Serrano
   * @description This class is used when the SDK is running in a
   * Nativescript Environment.
   */
  export class HTTP implements IHTTP {
    async get(url: string): Promise<object> {
      return new Promise<object>((resolve, reject) => {
        http.request({method: 'GET', url}).then(
          res => {
            resolve(res.content.toJSON());
            // Rehect on error
          },
          e => reject(e),
        );
      });
    }
  }

  /**
   * @class LocalStorage
   * @author Miguel Serrano
   * @description This class is used when the SDK is running in a
   * Nativescript Environment.
   */
  export class LocalStorage implements ILocalStorage {
    setItem(key: string, value: string): void {
      appSettings.setString(key, value);
    }
    getItem(key: string): string | null {
      return appSettings.getString(key);
    }
    removeItem(key: string): void {
      appSettings.remove(key);
    }
    clear(): void {
      appSettings.clear();
    }
  }
}
