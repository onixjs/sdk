import {ComponentReference} from './component.reference';
import {OperationType} from '../enums';
import {IAppOperation, IRequest} from '../interfaces';
import {Utils} from '../utils';
import {Subscription} from './subscription';
import {Interceptors} from './interceptor';
/**
 * @class ModuleReference
 * @author Jonathan Casarrubias
 * @license MIT
 */
export class MethodReference {
  /**
   * @constructor
   * @param name
   * @param componentReference
   */
  constructor(
    public name: string,
    public componentReference: ComponentReference,
  ) {}
  /**
   * @method call
   * @param payload
   * @description This method will call for RPC endpoints. It will send an application operation
   * to the OnixJS Service HOST.
   */
  async call(payload: any, filter?): Promise<any> {
    return new Promise(async (resolve, reject) => {
      if (this.invalid('rpc')) {
        reject(
          new Error(
            `ONIXJS CLIENT: Unable to call ${this.endpoint()}, RPC doesn't exist on OnixJS Server`,
          ),
        );
      } else {
        let operation: IAppOperation = {
          uuid: Utils.uuid(),
          type: OperationType.ONIX_REMOTE_CALL_PROCEDURE,
          message: {
            rpc: this.endpoint(),
            request: <IRequest>{
              metadata: {
                filter,
                stream: false,
                caller: this.componentReference.moduleReference.appReference
                  .config.claims.sub,
                token: this.componentReference.moduleReference.appReference
                  .config.token,
                register: this.componentReference.moduleReference.appReference.config.registration()
                  .uuid,
              },
              payload,
            },
          },
        };
        const listenerId: number = this.componentReference.moduleReference.appReference.config.listeners
          .namespace('remote')
          .add(async (response: IAppOperation) => {
            if (
              response.uuid === operation.uuid &&
              response.type ===
                OperationType.ONIX_REMOTE_CALL_PROCEDURE_RESPONSE
            ) {
              this.componentReference.moduleReference.appReference.config.listeners.remove(
                listenerId,
              );
              // Call for after interceptor
              if (Interceptors.after) {
                response = await Interceptors.after(response);
              }
              resolve(response.message.request.payload);
            }
          });
        // Call for before interceptor
        if (Interceptors.before) {
          operation = await Interceptors.before(operation);
        }
        // Send Operation to Server
        this.componentReference.moduleReference.appReference.config.client.send(
          JSON.stringify(operation),
        );
      }
    });
  }
  /**
   * @method stream
   * @param listener
   * @param filter
   * @description This method will register a stream, which will be populated as the server keeps
   * sending chunks of information.
   */
  async stream(
    listener: (stream: any) => void,
    filter?,
  ): Promise<Subscription> {
    return new Promise<Subscription>(resolve => {
      if (this.invalid('stream')) {
        listener(
          new Error(
            `ONIXJS CLIENT: Unable to call ${this.endpoint()}, RPC doesn't exist on OnixJS Server`,
          ),
        );
      } else {
        const operation: IAppOperation = {
          uuid: Utils.uuid(),
          type: OperationType.ONIX_REMOTE_CALL_PROCEDURE,
          message: {
            rpc: this.endpoint(),
            request: {
              metadata: {
                filter,
                stream: true,
                caller: this.componentReference.moduleReference.appReference
                  .config.claims.sub,
                token: this.componentReference.moduleReference.appReference
                  .config.token,
                register: this.componentReference.moduleReference.appReference.config.registration()
                  .uuid,
              },
              payload: undefined,
            },
          },
        };
        // Register Stream
        this.componentReference.moduleReference.appReference.config.client.send(
          JSON.stringify(operation),
        );
        // Chunks of information will be received in a future
        const id: number = this.componentReference.moduleReference.appReference.config.listeners
          .namespace('remote')
          .add((response: IAppOperation) => {
            if (response.uuid === operation.uuid) {
              if (response.type === OperationType.ONIX_REMOTE_CALL_STREAM) {
                listener(response.message.request.payload);
              } else if (
                response.type ===
                OperationType.ONIX_REMOTE_CALL_STREAM_SUBSCRIBED
              ) {
                resolve(
                  new Subscription(
                    id,
                    <number>response.message.request.metadata.listener,
                    this.endpoint(),
                    operation,
                    this.componentReference.moduleReference.appReference.config,
                  ),
                );
              }
            }
          });
      }
    });
  }

  private invalid(type: string): boolean {
    return (
      !this.componentReference.moduleReference.appReference.config.modules[
        this.componentReference.moduleReference.name
      ] ||
      !this.componentReference.moduleReference.appReference.config.modules[
        this.componentReference.moduleReference.name
      ] ||
      !this.componentReference.moduleReference.appReference.config.modules[
        this.componentReference.moduleReference.name
      ][this.componentReference.name] ||
      this.componentReference.moduleReference.appReference.config.modules[
        this.componentReference.moduleReference.name
      ][this.componentReference.name][this.name] !== type
    );
  }

  private endpoint(): string {
    return `${
      this.componentReference.moduleReference.appReference.config.name
    }.${this.componentReference.moduleReference.name}.${
      this.componentReference.name
    }.${this.name}`;
  }
}
