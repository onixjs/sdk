declare module "documentation" {
}
declare module "core/listener.collection" {
    import { Listener } from "interfaces/index";
    /**
     * @class ListenerCollection
     * @author Jonathan Casarrubias
     * @license MIT
     * @description This class is a memory database
     * that will store listeners from across the onixjs
     * platform.
     */
    export class ListenerCollection {
        /**
         * @prop ns
         * @description This is the current
         * database namespace, should be modified by
         * executing the namespace method before any
         * other procedure.
         */
        private ns;
        /**
         * @prop namespaces
         * @description This is a list of used namespaces
         * will be used mainly when destroying this collection.
         */
        private nss;
        /**
         * @prop listeners
         * @description In memory collection, contains
         * all the listeners registered within this context.
         */
        private listeners;
        /**
         * @method namespace
         * @param ns
         * @description This method will assign a namespace.
         * Should be executed
         */
        namespace(ns: string): this;
        /**
         * @method namespaces
         * @param ns
         * @description This method returns a list of namespaces
         */
        namespaces(): string[];
        /**
         * @method add
         * @param listener
         * @description This method will add a listener into
         * the current namespace database
         */
        add(listener: Listener): number;
        /**
         * @method remove
         * @param index
         * @description This method will remove a listener from the
         * current namespace.
         */
        remove(index: any): void;
        /**
         * @method broadcast
         * @param handler
         * @description will iterate over a collection list of listeners
         * depending on the current namespace and propagate the received data.
         */
        broadcast(data: any): void;
        /**
         * @method forEach
         * @param handler
         * @description will iterate over a collection list of listeners
         * depending on the current namespace and propagate the received data.
         */
        forEach(handler: any): void;
        /**
         * @method removeNameSpaceListeners
         * @description This method will remove any listener from every
         * collection from any namespace.
         */
        removeNameSpaceListeners(namespace: string): void;
        /**
         * @method removeAllListeners
         * @description This method will remove any listener from every
         * collection from any namespace.
         */
        removeAllListeners(): void;
    }
}
declare module "core/client.registration" {
    export class ClientRegistration {
        uuid: string;
        constructor(uuid: string);
    }
}
declare module "enums/index" {
    /**
     * @author Jonathan Casarrubias
     * @enum OperationType
     * @description Enum used for system level operations.
     */
    export const enum OperationType {
        APP_CREATE = 0,
        APP_CREATE_RESPONSE = 1,
        APP_PING = 2,
        APP_PING_RESPONSE = 3,
        APP_START = 4,
        APP_START_RESPONSE = 5,
        APP_STOP = 6,
        APP_STOP_RESPONSE = 7,
        APP_DESTROY = 8,
        APP_DESTROY_RESPONSE = 9,
        APP_GREET = 10,
        APP_GREET_RESPONSE = 11,
        ONIX_REMOTE_CALL_STREAM = 12,
        ONIX_REMOTE_CALL_PROCEDURE = 13,
        ONIX_REMOTE_CALL_PROCEDURE_RESPONSE = 14,
        ONIX_REMOTE_CALL_STREAM_UNSUBSCRIBE = 15,
        ONIX_REMOTE_CALL_STREAM_UNSUBSCRIBE_RESPONSE = 16,
        ONIX_REMOTE_REGISTER_CLIENT = 17,
        ONIX_REMOTE_REGISTER_CLIENT_RESPONSE = 18,
        ONIX_REMOTE_UNREGISTER_CLIENT = 19,
        ONIX_REMOTE_UNREGISTER_CLIENT_RESPONSE = 20,
    }
    export const enum RuntimeEnvironment {
        BROWSER = 0,
        NODE_JS = 1,
    }
}
declare module "interfaces/index" {
    import { ListenerCollection } from "core/listener.collection";
    import { ClientRegistration } from "core/client.registration";
    import { OperationType } from "enums/index";
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
        tries?: {
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
        client: any;
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
        index: number;
        collection: {
            [index: number]: Listener;
        };
    }
}
declare module "utils/index" {
    export namespace Utils {
        function IsJsonString(str: any): boolean;
        function uuid(): string;
        function getRandomInt(max: any): number;
    }
}
declare module "core/unsubscribe" {
    import { IAppOperation, IAppRefConfig } from "index";
    /**
     * @class Unsubscribe
     * @author Jonathan Casarrubias
     * @license MIT
     * @description This class will provide a way
     * to unsubscribe a stream from the server.
     */
    export class Unsubscribe {
        private id;
        private operation;
        private config;
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
        constructor(id: number, operation: IAppOperation, config: IAppRefConfig);
        /**
         * @method unsubscribe
         * @description This async method will resolve once the server
         * successfully unsubscribes the client from the configured
         * stream operation.
         */
        unsubscribe(): Promise<{}>;
    }
}
declare module "core/method.reference" {
    import { ComponentReference } from "core/component.reference";
    import { Unsubscribe } from "core/unsubscribe";
    /**
     * @class ModuleReference
     * @author Jonathan Casarrubias
     * @license MIT
     */
    export class MethodReference {
        name: string;
        componentReference: ComponentReference;
        /**
         * @constructor
         * @param name
         * @param componentReference
         */
        constructor(name: string, componentReference: ComponentReference);
        /**
         * @method call
         * @param payload
         * @description This method will call for RPC endpoints. It will send an application operation
         * to the OnixJS Service HOST.
         */
        call(payload: any, filter?: any): Promise<any>;
        /**
         * @method stream
         * @param listener
         * @param filter
         * @description This method will register a stream, which will be populated as the server keeps
         * sending chunks of information.
         */
        stream(listener: (stream: any) => void, filter?: any): Unsubscribe | undefined;
        private invalid(type);
        private endpoint();
    }
}
declare module "core/component.reference" {
    import { MethodReference } from "core/method.reference";
    import { ModuleReference } from "core/module.reference";
    /**
     * @class ModuleReference
     * @author Jonathan Casarrubias
     * @license MIT
     */
    export class ComponentReference {
        name: string;
        moduleReference: ModuleReference;
        private methods;
        constructor(name: string, moduleReference: ModuleReference);
        Method(name: string): MethodReference;
    }
}
declare module "core/module.reference" {
    import { ComponentReference } from "core/component.reference";
    import { AppReference } from "core/app.reference";
    /**
     * @class ModuleReference
     * @author Jonathan Casarrubias
     * @license MIT
     */
    export class ModuleReference {
        name: string;
        appReference: AppReference;
        private components;
        constructor(name: string, appReference: AppReference);
        Component(name: string): ComponentReference;
    }
}
declare module "core/app.reference" {
    import { IAppRefConfig } from "interfaces/index";
    import { ModuleReference } from "core/module.reference";
    export class AppReference {
        readonly config: IAppRefConfig;
        modules: {
            [key: string]: ModuleReference;
        };
        constructor(config: IAppRefConfig);
        Module(name: string): ModuleReference;
    }
}
declare module "core/index" {
    export * from "core/app.reference";
    export * from "core/module.reference";
    export * from "core/component.reference";
    export * from "core/method.reference";
    export { ListenerCollection } from "core/listener.collection";
}
declare module "index" {
    import { OnixClientConfig, IClaims } from "interfaces/index";
    import { AppReference } from "core/app.reference";
    import { ClientRegistration } from "core/client.registration";
    export * from "core/index";
    export * from "enums/index";
    export * from "interfaces/index";
    export const namespace = "onixjs:sdk";
    /**
     * @class OnixClient
     * @author Jonathan Casarrubias <gh: mean-expert-official>
     * @license MIT
     * @description This class provides core functionality for
     * client applications.
     */
    export class OnixClient {
        private config;
        private ws;
        private http;
        private storage;
        private listeners;
        private schema;
        private references;
        protected registration: ClientRegistration;
        /**
         * @constructor
         * @param config
         * @description Receives a client configuration, it will
         * also define a default value for our config incase is not
         * provided.
         */
        constructor(config: OnixClientConfig);
        /**
         * @method init
         * @description this method will get the onix infrastructure schema
         * in order to correctly configure each Application Reference.
         */
        init(): Promise<boolean>;
        /**
         * @method onDisconnect
         * @param handler
         * @description This method must be used to handle disconnections.
         * Any reference must be destroyed and re-created when the client
         * is connected again.
         */
        onDisconnect(handler: any): void;
        /**
         * @method connect
         * @description This method will be internally used to handle ws connection
         * on init or under unexpected disconnections.
         */
        private connect();
        /**
         * @method disconnected
         * @param e
         * @description This method will notify disconnections. When notifying
         * the subscribers, they must dispose subscriptions and run the sdk
         * initialization again.
         */
        private disconnected(e);
        /**
         * @method onerror
         * @param e
         * @description This method will log errored disconnections
         */
        private onerror(e);
        /**
         * @method onclose
         * @param e
         * @description This method will log close disconnections
         */
        private onclose(e);
        /**
         * @method
         * @param resolve
         */
        private register(resolve, reject);
        /**
         * @method ping
         */
        private ping(id);
        /**
         * @method disconnect
         * @description Disconnect from websocket server
         */
        disconnect(): void;
        /**
         * @class AppReference
         * @param name
         * @description This method will construct an application reference.
         * Only if the provided schema defines it does exist.
         */
        AppReference(name: string): Promise<AppReference>;
        /**
         * @description This getter will return a stored access token
         * from the local storage adapter.
         */
        /**
         * @description This setter will store a provided access token
         * into the local storage adapter.
         */
        token: string;
        /**
         * @method claims
         * @author Jonathan Casarrubias
         * @description This method will return an OIDC claims object.
         * Usually will provide the user information and any scope
         * defined within the OIDC Client.
         */
        claims(): Promise<IClaims>;
        waitForConnection(callback: any, interval?: number): void;
        /**
         * @method logout
         * @description this method will clear the local storage, therefore
         * cleaning any stored information like token or claims.
         */
        logout(): void;
    }
}
declare module "adapters/browser.adapters" {
    import { IWS, ILocalStorage } from "interfaces/index";
    import { IHTTP } from "index";
    /**
     * @namespace Browser
     * @author Jonathan Casarrubias
     * @description This namespace will provide adapters for
     * the SDK to work in Browser environments.
     */
    export namespace Browser {
        /**
         * @class WebSocket
         * @author Jonathan Casarrubias
         * @description This class is used when the SDK is running in a
         * Browser Environment.
         */
        class WebSocket implements IWS {
            client: any;
            connect(url: string): void;
            on(name: string, callback: any): void;
            send(something: string): void;
            open(callback: any): void;
            close(): void;
            removeAllListeners(): void;
        }
        /**
         * @class HTTP
         * @author Jonathan Casarrubias
         * @description This class is used when the SDK is running in a
         * Browser Environment.
         */
        class HTTP implements IHTTP {
            get(url: string): Promise<object>;
        }
        /**
         * @class LocalStorage
         * @author Jonathan Casarrubias
         * @description This class is used when the SDK is running in a
         * Browser Environment.
         */
        class LocalStorage implements ILocalStorage {
            setItem(key: string, value: string): void;
            getItem(key: string): string | null;
            removeItem(key: string): void;
            clear(): void;
        }
    }
}
declare module "adapters/nativescript.adapters" {
    import { IWS, IHTTP, ILocalStorage } from "interfaces/index";
    /**
     * @namespace Nativescript
     * @author Miguel Serrano
     * @description This namespace will provide adapters for the
     * SDK to work in a Nativescript environment,
     */
    export namespace Nativescript {
        /**
         * @class WebSocket
         * @author Miguel Serrano
         * @description This class is used when the SDK is running in a
         * Nativescript Environment.
         */
        class WebSocket implements IWS {
            client: any;
            connect(url: string): void;
            on(name: string, callback: any): void;
            send(something: string): void;
            open(callback: any): void;
            close(): void;
            removeAllListeners(): void;
        }
        /**
         * @class HTTP
         * @author Miguel Serrano
         * @description This class is used when the SDK is running in a
         * Nativescript Environment.
         */
        class HTTP implements IHTTP {
            get(url: string): Promise<object>;
        }
        /**
         * @class LocalStorage
         * @author Miguel Serrano
         * @description This class is used when the SDK is running in a
         * Nativescript Environment.
         */
        class LocalStorage implements ILocalStorage {
            setItem(key: string, value: string): void;
            getItem(key: string): string | null;
            removeItem(key: string): void;
            clear(): void;
        }
    }
}
declare module "adapters/node.adapters" {
    import { IWS, ILocalStorage } from "interfaces/index";
    import { IHTTP } from "index";
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
        class WebSocket implements IWS {
            client: any;
            connect(url: string): void;
            on(name: string, callback: any): void;
            send(something: string): void;
            open(callback: any): void;
            close(): void;
            removeAllListeners(): void;
        }
        /**
         * @class HTTP
         * @author Jonathan Casarrubias
         * @description This class is used when the SDK is running in a
         * NodeJS Environment.
         */
        class HTTP implements IHTTP {
            get(url: string): Promise<object>;
            post(config: any, request: any): Promise<object>;
        }
        /**
         * @class LocalStorage
         * @author Jonathan Casarrubias
         * @description This class is used when the SDK is running in a
         * NodeJS Environment.
         *
         * npm install node-localstorage
         */
        class LocalStorage implements ILocalStorage {
            localStorage: any;
            setItem(key: string, value: string): void;
            getItem(key: string): string | null;
            removeItem(key: string): void;
            clear(): void;
        }
    }
}
