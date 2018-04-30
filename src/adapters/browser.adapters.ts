import {IWS, ILocalStorage} from '../interfaces';
import {IHTTP} from '..';
import {Utils} from '../utils';
// Workaround to avoid naming issues
const WS = WebSocket;
/**
 * @namespace Browser
 * @author Jonathan Casarrubias
 * @description This namespace will provide adapters for
 * the SDK to work in Browser environments.
 */
export namespace Browser {
  /**
   * @class WebSocket
   * @author Jonathan Casarrubias
   * @description This class is used when the SDK is running in a
   * Browser Environment.
   */
  export class WebSocket implements IWS {
    private connection;
    connect(url: string) {
      this.connection = new WS(url);
    }
    on(name: string, callback) {
      switch (name) {
        case 'message':
          this.connection.onmessage = event => {
            callback(
              Utils.IsJsonString(event.data)
                ? JSON.parse(event.data)
                : event.data,
            );
          };
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
      this.connection.onopen = callback;
    }
  }
  /**
   * @class HTTP
   * @author Jonathan Casarrubias
   * @description This class is used when the SDK is running in a
   * Browser Environment.
   */
  export class HTTP implements IHTTP {
    async get(url: string): Promise<object> {
      return new Promise<object>((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.onreadystatechange = function() {
          if (request.readyState === 4) {
            resolve(JSON.parse(request.responseText));
          }
        };
        request.open('GET', url, true);
        request.send(null);
      });
    }
  }
  /**
   * @class LocalStorage
   * @author Jonathan Casarrubias
   * @description This class is used when the SDK is running in a
   * Browser Environment.
   */
  export class LocalStorage implements ILocalStorage {
    setItem(key: string, value: string): void {
      localStorage.setItem(key, value);
    }
    getItem(key: string): string | null {
      return localStorage.getItem(key);
    }
    removeItem(key: string): void {
      localStorage.removeItem(key);
    }
    clear(): void {
      localStorage.clear();
    }
  }
}
