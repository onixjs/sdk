import {IWS, ILocalStorage} from '../interfaces';
import {IHTTP} from '..';
import * as WS from 'ws';
import * as http from 'http';
import * as https from 'https';
import {Utils} from '../utils';
import {LocalStorage as LS} from 'node-localstorage';
/**
 * @namespace NodeJS
 * @author Jonathan Casarrubias
 * @description This namespace will provide adapters for the
 * SDK to work in a NodeJS Environment,
 */
export namespace NodeJS {
  /**
   * @class WebSocket
   * @author Jonathan Casarrubias
   * @description This class is used when the SDK is running in a
   * NodeJS Environment.
   */
  export class WebSocket implements IWS {
    private connection;
    connect(url: string) {
      this.connection = new WS(url);
    }
    on(name: string, callback) {
      switch (name) {
        case 'close':
          this.connection.onclose = callback;
          break;
        default:
          this.connection.on(name, callback);
      }
    }
    send(something: string) {
      this.connection.send(something);
    }
    open(callback) {
      this.connection.on('open', callback);
    }
    close() {
      this.connection.close();
    }
  }
  /**
   * @class HTTP
   * @author Jonathan Casarrubias
   * @description This class is used when the SDK is running in a
   * NodeJS Environment.
   */
  export class HTTP implements IHTTP {
    async get(url: string): Promise<object> {
      return new Promise<object>((resolve, reject) => {
        const cb = res => {
          res.setEncoding('utf8');
          let body = '';
          // Concatenate Response
          res.on('data', data => (body += data));
          // Resolve Call
          res.on('end', () =>
            resolve(Utils.IsJsonString(body) ? JSON.parse(body) : body),
          );
          // Rehect on error
        };
        if (url.match(/https:\/\//)) {
          https.get(url, cb).on('error', e => reject(e));
        } else {
          http.get(url, cb).on('error', e => reject(e));
        }
      });
    }
    async post(config, request): Promise<object> {
      return new Promise((resolve, reject) => {
        // Set request options (Can be overrided from caller)
        const options = Object.assign(
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          },
          config,
        );
        // Create request object
        const req = http.request(options, function(res) {
          res.setEncoding('utf8');
          let body = '';
          // Concatenate Response
          res.on('data', data => (body += data));
          // Resolve Call
          res.on('end', () => {
            resolve(Utils.IsJsonString(body) ? JSON.parse(body) : body);
          });
          // Rehect on error
        });
        req.on('error', e => reject(e));
        // write data to request body
        req.write(JSON.stringify(request));
        req.end();
      });
    }
  }
  /**
   * @class LocalStorage
   * @author Jonathan Casarrubias
   * @description This class is used when the SDK is running in a
   * NodeJS Environment.
   *
   * npm install node-localstorage
   */
  export class LocalStorage implements ILocalStorage {
    localStorage = new LS('sdk:storage');

    setItem(key: string, value: string): void {
      this.localStorage.setItem(key, value);
    }
    getItem(key: string): string | null {
      return this.localStorage.getItem(key);
    }
    removeItem(key: string): void {
      this.localStorage.removeItem(key);
    }
    clear(): void {
      this.localStorage.clear();
    }
  }
}
