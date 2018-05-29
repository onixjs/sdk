import {ListenerCollection} from '../core/listener.collection';
import {ClientRegistration} from '../core/client.registration';
import {OperationType} from '../enums';
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
  metadata: IMetaData;
  payload: any;
}
/**
 * @interface IMetaData
 * @author Jonathan Casarrubias
 * @description Interface used as generic IMetaData class.
 */
export interface IMetaData {
  [key: string]: any;
  sub?: string;
  token?: string;
  stream: boolean;
  subscription: string;
}
export interface OnixClientConfig {
  host: string;
  port: number;
  adapters: IAdapters;
  prefix?: string;
  intervals?: {
    ping?: number;
    reconnect?: number;
    timeout?: number;
  };
  attempts?: {
    ping?: number;
  };
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
  client;
  connect(url: string): void;
  on(event: string, callback: (data: MessageEvent | string) => void): void;
  send(something: string | object): void;
  open(callback: () => void): void;
  close(): void;
  removeAllListeners(): void;
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
  listeners: ListenerCollection;
  registration: () => ClientRegistration;
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

export interface Listener {
  (operation: IAppOperation): void;
}

export class ListenerCollectionList {
  index: number = 0;
  collection: {[index: number]: Listener} = {};
}
