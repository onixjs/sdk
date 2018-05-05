/**
 * @author Jonathan Casarrubias
 * @interface IAppOperation
 * @description Internal system operation, executed when
 * RPC calls are made.
 */
export interface IAppOperation {
  uuid: string;
  type: OperationType;
  message: OnixMessage;
}
/**
 * @interface OnixMessage
 * @author Jonathan Casarrubias
 * @description OnixMessage Contract
 */
export interface OnixMessage {
  rpc: string;
  request: IRequest;
}
/**
 * @interface IRequest
 * @author Jonathan Casarrubias
 * @description IRequest inteface
 */
export interface IRequest {
  metadata: {[key: string]: any; stream?: boolean};
  payload: any;
}
/**
 * @author Jonathan Casarrubias
 * @enum OperationType
 * @description Enum used for system level operations.
 */
export enum OperationType {
  /*0*/ APP_CREATE,
  /*1*/ APP_CREATE_RESPONSE,
  /*2*/ APP_PING,
  /*3*/ APP_PING_RESPONSE,
  /*4*/ APP_START,
  /*5*/ APP_START_RESPONSE,
  /*6*/ APP_STOP,
  /*7*/ APP_STOP_RESPONSE,
  /*8*/ APP_DESTROY,
  /*9*/ APP_DESTROY_RESPONSE,
  /*10*/ APP_GREET,
  /*11*/ APP_GREET_RESPONSE,
  /*12*/ ONIX_REMOTE_CALL_STREAM,
  /*13*/ ONIX_REMOTE_CALL_PROCEDURE,
  /*14*/ ONIX_REMOTE_CALL_PROCEDURE_RESPONSE,
}
// Required because of different http modules
export enum RuntimeEnvironment {
  /*0*/ BROWSER,
  /*1*/ NODE_JS,
}
export interface OnixClientConfig {
  host: string;
  port: number;
  adapters: IAdapters;
  prefix?: string;
}
export interface IAdapters {
  http: new () => IHTTP;
  websocket: new () => IWS;
  storage: new () => ILocalStorage;
}
export interface IHTTP {
  get(url: string): Promise<object>;
}
export interface IWS {
  connect(url: string): void;
  on(event: string, callback: (data: MessageEvent | string) => void): void;
  send(something: string | object): void;
  open(callback: () => void): void;
  close(): void;
}
export interface ILocalStorage {
  setItem(key: string, value: string): void;
  getItem(key: string): string | null;
  removeItem(key: string): void;
  clear(): void;
}
export interface IOperationListener {
  (operation: IAppOperation): void;
}
export interface IClaims {
  sub: string;
  [key: string]: any;
}
export interface IAppRefConfig {
  name: string;
  host: string;
  port: number;
  client: IWS;
  token: string;
  claims: IClaims;
  modules: {
    [moduleName: string]: {
      [componentName: string]: {
        [methodName: string]: string;
      };
    };
  };
  addListener: (listener: (operation: IAppOperation) => void) => number;
  removeListener: (index: number) => boolean;
}
/**
 * @interface ICall
 * @author Jonathan Casarrubias
 * @description ICall inteface for internal (OS Event communication)
 */
export interface ICall {
  uuid: string;
  rpc: string;
  request: IRequest;
}
