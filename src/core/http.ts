import {IHTTP} from '../interfaces';
/**
 * @namespace HTTP
 * @author Jonathan Casarrubias
 * @description This namespace contains buil-int classes that
 * are used as HTTP Client in different runtime environments.
 *
 * BROWSER | NODE
 */
export namespace HTTP {
  /**
   * @class HTTPBrowserClient
   * @author Jonathan Casarrubias
   * @description This class is used when the SDK is running in a
   * Browser Environment.
   */
  export class HTTPBrowserClient implements IHTTP {
    async get(url: string): Promise<object> {
      return new Promise<object>((resolve, reject) => {
        const anHttpRequest = new XMLHttpRequest();
        anHttpRequest.onreadystatechange = function() {
          resolve(JSON.parse(anHttpRequest.responseText));
        };
        anHttpRequest.open('GET', url, true);
        anHttpRequest.send(null);
      });
    }
  }
  /**
   * @class HTTPNodeClient
   * @author Jonathan Casarrubias
   * @description This class is used when the SDK is running in a
   * NodeJS Environment.
   */
  export class HTTPNodeClient implements IHTTP {
    async get(url: string): Promise<object> {
      return new Promise<object>((resolve, reject) =>
        (url.match(/https:\/\//) ? require('https') : require('http'))
          .get(url, res => {
            res.setEncoding('utf8');
            let body = '';
            // Concatenate Response
            res.on('data', data => (body += data));
            // Resolve Call
            res.on('end', () => resolve(JSON.parse(body)));
            // Rehect on error
          })
          .on('error', e => reject(JSON.parse(e))),
      );
    }
  }
}
