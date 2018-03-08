import {IWS} from '../interfaces';
/**
 * @namespace WS
 * @author Jonathan Casarrubias
 * @description This namespace contains buil-int classes that
 * are used as WS Client in different runtime environments.
 *
 * BROWSER | NODE
 */
export namespace WS {
  /**
   * @class WSBrowserClient
   * @author Jonathan Casarrubias
   * @description This class is used when the SDK is running in a
   * Browser Environment.
   */
  export class WSBrowserClient implements IWS {
    private connection: WebSocket;

    constructor(url: string) {
      this.connection = new WebSocket(url);
    }

    on(name: string, callback: (event: MessageEvent | string) => void) {
      switch (name) {
        case 'message':
          this.connection.onmessage = event => callback(event.data);
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

    open(callback: () => void) {
      this.connection.onopen = callback;
    }
  }
  /**
   * @class WSNodeClient
   * @author Jonathan Casarrubias
   * @description This class is used when the SDK is running in a
   * NodeJS Environment.
   */
  export class WSNodeClient implements IWS {
    private connection;

    constructor(url: string) {
      const UWS = require('uws');
      this.connection = new UWS(url);
    }

    on(name: string, callback: (event: MessageEvent | string) => void) {
      this.connection.on(name, callback);
    }

    send(something: string) {
      this.connection.send(something);
    }

    open(callback: () => void) {
      this.connection.on('open', callback);
    }
  }
}
