import {IAppOperation, OperationType, IAppRefConfig} from '..';
import {Utils} from '../utils';
/**
 * @class Subscription
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This class will provide a way
 * to unsubscribe a stream from the server.
 */
export class Subscription {
  /**
   * @constructor
   * @param id
   * @param operation
   * @param config
   * @description This constructor will require the id
   * of the listener to be unsubscribed, the original operation
   * sent to the server in order to request the server to unsubscribe
   * and finally the app config so we can use the listeners database
   * and websocket client to finalize these listeners.
   */
  constructor(
    private id: number,
    private listener: number,
    private endpoint: string,
    private operation: IAppOperation,
    private config: IAppRefConfig,
  ) {}
  /**
   * @method unsubscribe
   * @description This async method will resolve once the server
   * successfully unsubscribes the client from the configured
   * stream operation.
   */
  async unsubscribe() {
    return new Promise((resolve, reject) => {
      // Create unsubscribe app operation
      const operation: IAppOperation = {
        uuid: Utils.uuid(),
        type: OperationType.ONIX_REMOTE_CALL_STREAM_UNSUBSCRIBE,
        message: {
          rpc: `${this.endpoint}.unsubscribe`,
          request: {
            metadata: {
              stream: false,
              register: this.config.registration().uuid,
              listener: this.listener,
              subscription: this.operation.uuid,
            },
            payload: this.operation,
          },
        },
      };
      // Create a listener for this unsubscription, it will be removed
      // once the server finish with the back process.
      const id: number = this.config.listeners.add(
        (response: IAppOperation) => {
          if (
            response.uuid === operation.uuid &&
            response.type ===
              OperationType.ONIX_REMOTE_CALL_STREAM_UNSUBSCRIBE_RESPONSE
          ) {
            // Remove unsubscribe listener
            this.config.listeners.remove(id);
            // Remove original stream listener
            this.config.listeners.remove(this.id);
            // Resolve promise
            resolve();
          }
        },
      );
      // Communicate the server that we want to get rid of this stream subscription
      this.config.client.send(JSON.stringify(operation));
    });
  }
}
