import {ComponentReference} from './component.reference';
import {IAppOperation, OperationType, IRequest} from '../interfaces';
import {Utils} from '../utils';
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
  async call(payload: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.invalid('rpc')) {
        reject(
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
            request: <IRequest>{
              metadata: {
                stream: false,
                caller: this.componentReference.moduleReference.appReference
                  .config.claims.sub,
                token: this.componentReference.moduleReference.appReference
                  .config.token,
              },
              payload,
            },
          },
        };
        const listenerId: number = this.componentReference.moduleReference.appReference.config.addListener(
          (response: IAppOperation) => {
            if (
              response.uuid === operation.uuid &&
              response.type ===
                OperationType.ONIX_REMOTE_CALL_PROCEDURE_RESPONSE
            ) {
              resolve(response.message.request.payload);
              this.componentReference.moduleReference.appReference.config.removeListener(
                listenerId,
              );
            }
            // TODO ADD TIMEOUT RESPONSE HERE
          },
        );
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
   * @param payload
   * @description This method will register a stream, which will be populated as the server keeps
   * sending chunks of information.
   */
  stream(listener: (stream: any) => void, payload?) {
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
              stream: true,
              caller: this.componentReference.moduleReference.appReference
                .config.claims.sub,
              token: this.componentReference.moduleReference.appReference.config
                .token,
            },
            payload,
          },
        },
      };
      // Register Stream
      this.componentReference.moduleReference.appReference.config.client.send(
        JSON.stringify(operation),
      );
      // Chunks of information will be received in a future
      return this.componentReference.moduleReference.appReference.config.addListener(
        (response: IAppOperation) => {
          if (
            response.uuid === operation.uuid &&
            response.type === OperationType.ONIX_REMOTE_CALL_STREAM
          ) {
            listener(response.message.request.payload);
          }
        },
      );
    }
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
