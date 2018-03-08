import {
  IAppRefConfig,
  IWS,
  ICall,
  IRequest,
  IAppOperation,
  OperationType,
} from '../interfaces';
import * as uuid from 'uuid';

export class ModuleReference {
  // components
  private components: {[key: string]: ComponentReference} = {};
  constructor(public name: string, public appReference: AppReference) {}
  public Component(name: string): ComponentReference {
    if (!this.components[name])
      this.components[name] = new ComponentReference(name, this);
    return this.components[name];
  }
}

export class ComponentReference {
  private methods: {[key: string]: MethodReference} = {};
  constructor(public name: string, public moduleReference: ModuleReference) {}
  public Method(name: string): MethodReference {
    if (!this.methods[name])
      this.methods[name] = new MethodReference(name, this);
    return this.methods[name];
  }
}

export class MethodReference {
  constructor(
    public name: string,
    public componentReference: ComponentReference,
  ) {}

  async call(payload: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.invalid('rpc')) {
        reject(
          new Error(
            `ONIXJS CLIENT: Unable to call ${this.endpoint()}, RPC doesn't exist on OnixJS Server`,
          ),
        );
      } else {
        const operationId = uuid();
        const listenerId: number = this.componentReference.moduleReference.appReference.addListener(
          (data: string) => {
            const operation: IAppOperation = JSON.parse(data);
            if (
              operation.uuid === operationId &&
              operation.type ===
                OperationType.ONIX_REMOTE_CALL_PROCEDURE_RESPONSE
            ) {
              this.componentReference.moduleReference.appReference.removeListener(
                listenerId,
              );
              resolve(operation.message);
            }
            // TODO ADD TIMEOUT RESPONSE HERE
          },
        );
        this.componentReference.moduleReference.appReference.WebSocket.send(
          JSON.stringify(<ICall>{
            uuid: operationId,
            rpc: this.endpoint(),
            request: <IRequest>{
              metadata: {
                stream: false,
                caller: 'SDK',
                token: 'dummytoken',
              },
              payload,
            },
          }),
        );
      }
    });
  }

  async stream(listener: (stream: any) => void) {
    if (this.invalid('stream')) {
      listener(
        new Error(
          `ONIXJS CLIENT: Unable to call ${this.endpoint()}, RPC doesn't exist on OnixJS Server`,
        ),
      );
    } else {
      const operationId = uuid();
      this.componentReference.moduleReference.appReference.WebSocket.send(
        JSON.stringify(<ICall>{
          uuid: operationId,
          rpc: this.endpoint(),
          request: <IRequest>{
            metadata: {
              stream: true,
              caller: 'SDK',
              token: 'dummytoken',
            },
            payload: undefined,
          },
        }),
      );
      return this.componentReference.moduleReference.appReference.addListener(
        (data: string) => {
          const operation: IAppOperation = JSON.parse(data);
          if (
            operation.uuid === operationId &&
            operation.type === OperationType.ONIX_REMOTE_CALL_STREAM
          ) {
            listener(operation.message);
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

export class AppReference {
  private index: number = 0;
  private listeners: {[key: number]: ((data: string) => void)} = {};
  // modules
  private modules: {[key: string]: ModuleReference} = {};
  // WebSocket Client Reference
  public WebSocket: IWS;
  // Todo Client
  constructor(public readonly config: IAppRefConfig) {}

  async connect(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this.WebSocket = new this.config.client(
        `${this.config.port === 443 ? 'wss' : 'ws'}://${this.config.host}:${
          this.config.port
        }`,
      );
      this.WebSocket.open(() => resolve());
      this.WebSocket.on('message', (data: string) =>
        Object.keys(this.listeners)
          .map(key => this.listeners[key])
          .forEach((listener: (data: string) => void) => listener(data)),
      );
    });
  }

  removeListener(id: number): boolean {
    if (this.listeners[id]) {
      delete this.listeners[id];
      return true;
    } else {
      return false;
    }
  }

  addListener(listener: (data: string) => void) {
    this.index += 1;
    this.listeners[this.index] = listener;
    return this.index;
  }

  Module(name: string): ModuleReference {
    if (!this.modules[name])
      this.modules[name] = new ModuleReference(name, this);
    return this.modules[name];
  }
}
