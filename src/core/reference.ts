import {
  IAppRefConfig,
  ICall,
  IRequest,
  IAppOperation,
  OperationType,
} from '../interfaces';
import {Utils} from '../utils';

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
        const operationId = Utils.uuid();
        const listenerId: number = this.componentReference.moduleReference.appReference.addListener(
          (operation: IAppOperation | string) => {
            operation = Utils.IsJsonString(operation)
              ? JSON.parse(<string>operation)
              : operation;
            if (
              typeof operation !== 'string' &&
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
        this.componentReference.moduleReference.appReference.config.client.send(
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

  stream(listener: (stream: any) => void) {
    if (this.invalid('stream')) {
      listener(
        new Error(
          `ONIXJS CLIENT: Unable to call ${this.endpoint()}, RPC doesn't exist on OnixJS Server`,
        ),
      );
    } else {
      const operationId = Utils.uuid();
      this.componentReference.moduleReference.appReference.config.client.send(
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
        (operation: IAppOperation | string) => {
          operation = Utils.IsJsonString(operation)
            ? JSON.parse(<string>operation)
            : operation;
          if (
            typeof operation !== 'string' &&
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
  private listeners: {[key: number]: ((operation: IAppOperation) => void)} = {};
  // modules
  private modules: {[key: string]: ModuleReference} = {};
  // Todo Client
  constructor(public readonly config: IAppRefConfig) {}

  async connect(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this.config.client.connect(
        `${this.config.port === 443 ? 'wss' : 'ws'}://${this.config.host}:${
          this.config.port
        }`,
      );
      this.config.client.open(() => resolve());
      this.config.client.on('message', (data: string) =>
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

  addListener(listener: (operation: IAppOperation) => void) {
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
