declare module "documentation" {
}
declare module "interfaces/index" {
    /**
     * @author Jonathan Casarrubias
     * @interface IAppOperation
     * @description Internal system operation, executed when
     * RPC calls are made.
     */
    export interface IAppOperation {
        uuid: string;
        type: OperationType;
        message: any;
    }
    /**
     * @author Jonathan Casarrubias
     * @enum OperationType
     * @description Enum used for system level operations.
     */
    export enum OperationType {
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
    }
    export enum RuntimeEnvironment {
        BROWSER = 0,
        NODE_JS = 1,
    }
    export interface OnixClientConfig {
        host: string;
        port: number;
        adapters: IAdapters;
    }
    export interface IAdapters {
        http: new () => IHTTP;
        websocket: new () => IWS;
    }
    export interface IHTTP {
        get(url: string): Promise<object>;
    }
    export interface IWS {
        connect(url: string): void;
        on(event: string, callback: (data: MessageEvent | string) => void): void;
        send(something: string | object): void;
        open(callback: () => void): void;
    }
    export interface IAppRefConfig {
        name: string;
        host: string;
        port: number;
        client: IWS;
        modules: {
            [moduleName: string]: {
                [componentName: string]: {
                    [methodName: string]: string;
                };
            };
        };
    }
    /**
     * @interface IRequest
     * @author Jonathan Casarrubias
     * @description IRequest inteface
     */
    export interface IRequest {
        metadata: {
            [key: string]: any;
        };
        payload: any;
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
}
declare module "utils/index" {
    export namespace Utils {
        function IsJsonString(str: any): boolean;
        function uuid(): string;
        function getRandomInt(max: any): number;
    }
}
declare module "core/reference" {
    import { IAppRefConfig, IAppOperation } from "interfaces/index";
    export class ModuleReference {
        name: string;
        appReference: AppReference;
        private components;
        constructor(name: string, appReference: AppReference);
        Component(name: string): ComponentReference;
    }
    export class ComponentReference {
        name: string;
        moduleReference: ModuleReference;
        private methods;
        constructor(name: string, moduleReference: ModuleReference);
        Method(name: string): MethodReference;
    }
    export class MethodReference {
        name: string;
        componentReference: ComponentReference;
        constructor(name: string, componentReference: ComponentReference);
        call(payload: any): Promise<any>;
        stream(listener: (stream: any) => void): number | undefined;
        private invalid(type);
        private endpoint();
    }
    export class AppReference {
        readonly config: IAppRefConfig;
        private index;
        private listeners;
        private modules;
        constructor(config: IAppRefConfig);
        connect(): Promise<any>;
        removeListener(id: number): boolean;
        addListener(listener: (operation: IAppOperation) => void): number;
        Module(name: string): ModuleReference;
    }
}
declare module "core/index" {
    export * from "core/reference";
}
declare module "index" {
    import { OnixClientConfig } from "interfaces/index";
    import { AppReference } from "core/index";
    export * from "core/index";
    export * from "interfaces/index";
    /**
     * @class OnixClient
     * @author Jonathan Casarrubias <gh: mean-expert-official>
     * @license MIT
     * @description This class provides core functionality for
     * client applications.
     */
    export class OnixClient {
        private config;
        private _http;
        private _schema;
        private _references;
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
        AppReference(name: string): Promise<AppReference | Error>;
    }
}
declare module "core/browser.adapters" {
    import { IWS } from "interfaces/index";
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
            private connection;
            connect(url: string): void;
            on(name: string, callback: any): void;
            send(something: string): void;
            open(callback: any): void;
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
    }
}
declare module "core/nativescript.adapters" {
    import { IWS, IHTTP } from "interfaces/index";
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
            private connection;
            connect(url: string): void;
            on(name: string, callback: any): void;
            send(something: string): void;
            open(callback: any): void;
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
    }
}
declare module "core/node.adapters" {
    import { IWS } from "interfaces/index";
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
            private connection;
            connect(url: string): void;
            on(name: string, callback: any): void;
            send(something: string): void;
            open(callback: any): void;
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
    }
}
