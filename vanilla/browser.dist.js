define("documentation", ["require", "exports", "serve-static", "finalhandler", "http", "path"], function (require, exports, serveStatic, finalhandler, http, path) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const serve = serveStatic(path.join(process.cwd(), 'documentation'), {
        index: ['index.html'],
    });
    // Create server
    const server = http.createServer(function onRequest(req, res) {
        serve(req, res, finalhandler(req, res));
    });
    // Listen
    server.listen(3000);
});
define("interfaces/index", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * @author Jonathan Casarrubias
     * @enum OperationType
     * @description Enum used for system level operations.
     */
    var OperationType;
    (function (OperationType) {
        /*0*/ OperationType[OperationType["APP_CREATE"] = 0] = "APP_CREATE";
        /*1*/ OperationType[OperationType["APP_CREATE_RESPONSE"] = 1] = "APP_CREATE_RESPONSE";
        /*2*/ OperationType[OperationType["APP_PING"] = 2] = "APP_PING";
        /*3*/ OperationType[OperationType["APP_PING_RESPONSE"] = 3] = "APP_PING_RESPONSE";
        /*4*/ OperationType[OperationType["APP_START"] = 4] = "APP_START";
        /*5*/ OperationType[OperationType["APP_START_RESPONSE"] = 5] = "APP_START_RESPONSE";
        /*6*/ OperationType[OperationType["APP_STOP"] = 6] = "APP_STOP";
        /*7*/ OperationType[OperationType["APP_STOP_RESPONSE"] = 7] = "APP_STOP_RESPONSE";
        /*8*/ OperationType[OperationType["APP_DESTROY"] = 8] = "APP_DESTROY";
        /*9*/ OperationType[OperationType["APP_DESTROY_RESPONSE"] = 9] = "APP_DESTROY_RESPONSE";
        /*10*/ OperationType[OperationType["APP_GREET"] = 10] = "APP_GREET";
        /*11*/ OperationType[OperationType["APP_GREET_RESPONSE"] = 11] = "APP_GREET_RESPONSE";
        /*12*/ OperationType[OperationType["ONIX_REMOTE_CALL_STREAM"] = 12] = "ONIX_REMOTE_CALL_STREAM";
        /*13*/ OperationType[OperationType["ONIX_REMOTE_CALL_PROCEDURE"] = 13] = "ONIX_REMOTE_CALL_PROCEDURE";
        /*14*/ OperationType[OperationType["ONIX_REMOTE_CALL_PROCEDURE_RESPONSE"] = 14] = "ONIX_REMOTE_CALL_PROCEDURE_RESPONSE";
    })(OperationType = exports.OperationType || (exports.OperationType = {}));
    // Required because of different http modules
    var RuntimeEnvironment;
    (function (RuntimeEnvironment) {
        /*0*/ RuntimeEnvironment[RuntimeEnvironment["BROWSER"] = 0] = "BROWSER";
        /*1*/ RuntimeEnvironment[RuntimeEnvironment["NODE_JS"] = 1] = "NODE_JS";
    })(RuntimeEnvironment = exports.RuntimeEnvironment || (exports.RuntimeEnvironment = {}));
});
define("utils/index", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Utils;
    (function (Utils) {
        function IsJsonString(str) {
            try {
                JSON.parse(str);
            }
            catch (e) {
                return false;
            }
            return true;
        }
        Utils.IsJsonString = IsJsonString;
        function uuid() {
            return `${new Date().getMilliseconds()}:${Utils.getRandomInt(9999999999999)}:${Utils.getRandomInt(9999999999999)}`;
        }
        Utils.uuid = uuid;
        function getRandomInt(max) {
            return Math.floor(Math.random() * Math.floor(max));
        }
        Utils.getRandomInt = getRandomInt;
    })(Utils = exports.Utils || (exports.Utils = {}));
});
define("core/reference", ["require", "exports", "interfaces/index", "utils/index"], function (require, exports, interfaces_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ModuleReference {
        constructor(name, appReference) {
            this.name = name;
            this.appReference = appReference;
            // components
            this.components = {};
        }
        Component(name) {
            if (!this.components[name])
                this.components[name] = new ComponentReference(name, this);
            return this.components[name];
        }
    }
    exports.ModuleReference = ModuleReference;
    class ComponentReference {
        constructor(name, moduleReference) {
            this.name = name;
            this.moduleReference = moduleReference;
            this.methods = {};
        }
        Method(name) {
            if (!this.methods[name])
                this.methods[name] = new MethodReference(name, this);
            return this.methods[name];
        }
    }
    exports.ComponentReference = ComponentReference;
    class MethodReference {
        constructor(name, componentReference) {
            this.name = name;
            this.componentReference = componentReference;
        }
        async call(payload) {
            return new Promise((resolve, reject) => {
                if (this.invalid('rpc')) {
                    reject(new Error(`ONIXJS CLIENT: Unable to call ${this.endpoint()}, RPC doesn't exist on OnixJS Server`));
                }
                else {
                    const operationId = utils_1.Utils.uuid();
                    const listenerId = this.componentReference.moduleReference.appReference.addListener((operation) => {
                        operation = utils_1.Utils.IsJsonString(operation)
                            ? JSON.parse(operation)
                            : operation;
                        if (typeof operation !== 'string' &&
                            operation.uuid === operationId &&
                            operation.type ===
                                interfaces_1.OperationType.ONIX_REMOTE_CALL_PROCEDURE_RESPONSE) {
                            this.componentReference.moduleReference.appReference.removeListener(listenerId);
                            resolve(operation.message);
                        }
                        // TODO ADD TIMEOUT RESPONSE HERE
                    });
                    this.componentReference.moduleReference.appReference.config.client.send(JSON.stringify({
                        uuid: operationId,
                        rpc: this.endpoint(),
                        request: {
                            metadata: {
                                stream: false,
                                caller: 'SDK',
                                token: 'dummytoken',
                            },
                            payload,
                        },
                    }));
                }
            });
        }
        stream(listener) {
            if (this.invalid('stream')) {
                listener(new Error(`ONIXJS CLIENT: Unable to call ${this.endpoint()}, RPC doesn't exist on OnixJS Server`));
            }
            else {
                const operationId = utils_1.Utils.uuid();
                this.componentReference.moduleReference.appReference.config.client.send(JSON.stringify({
                    uuid: operationId,
                    rpc: this.endpoint(),
                    request: {
                        metadata: {
                            stream: true,
                            caller: 'SDK',
                            token: 'dummytoken',
                        },
                        payload: undefined,
                    },
                }));
                return this.componentReference.moduleReference.appReference.addListener((operation) => {
                    operation = utils_1.Utils.IsJsonString(operation)
                        ? JSON.parse(operation)
                        : operation;
                    if (typeof operation !== 'string' &&
                        operation.uuid === operationId &&
                        operation.type === interfaces_1.OperationType.ONIX_REMOTE_CALL_STREAM) {
                        listener(operation.message);
                    }
                });
            }
        }
        invalid(type) {
            return (!this.componentReference.moduleReference.appReference.config.modules[this.componentReference.moduleReference.name] ||
                !this.componentReference.moduleReference.appReference.config.modules[this.componentReference.moduleReference.name] ||
                !this.componentReference.moduleReference.appReference.config.modules[this.componentReference.moduleReference.name][this.componentReference.name] ||
                this.componentReference.moduleReference.appReference.config.modules[this.componentReference.moduleReference.name][this.componentReference.name][this.name] !== type);
        }
        endpoint() {
            return `${this.componentReference.moduleReference.appReference.config.name}.${this.componentReference.moduleReference.name}.${this.componentReference.name}.${this.name}`;
        }
    }
    exports.MethodReference = MethodReference;
    class AppReference {
        // Todo Client
        constructor(config) {
            this.config = config;
            this.index = 0;
            this.listeners = {};
            // modules
            this.modules = {};
        }
        async connect() {
            return new Promise((resolve, reject) => {
                this.config.client.connect(`${this.config.port === 443 ? 'wss' : 'ws'}://${this.config.host}:${this.config.port}`);
                this.config.client.open(() => resolve());
                this.config.client.on('message', (data) => Object.keys(this.listeners)
                    .map(key => this.listeners[key])
                    .forEach((listener) => listener(data)));
            });
        }
        removeListener(id) {
            if (this.listeners[id]) {
                delete this.listeners[id];
                return true;
            }
            else {
                return false;
            }
        }
        addListener(listener) {
            this.index += 1;
            this.listeners[this.index] = listener;
            return this.index;
        }
        Module(name) {
            if (!this.modules[name])
                this.modules[name] = new ModuleReference(name, this);
            return this.modules[name];
        }
    }
    exports.AppReference = AppReference;
});
define("core/index", ["require", "exports", "core/reference"], function (require, exports, reference_1) {
    "use strict";
    function __export(m) {
        for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
    }
    Object.defineProperty(exports, "__esModule", { value: true });
    __export(reference_1);
});
define("index", ["require", "exports", "core/index", "core/index", "interfaces/index"], function (require, exports, core_1, core_2, interfaces_2) {
    "use strict";
    function __export(m) {
        for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
    }
    Object.defineProperty(exports, "__esModule", { value: true });
    __export(core_2);
    __export(interfaces_2);
    /**
     * @class OnixClient
     * @author Jonathan Casarrubias <gh: mean-expert-official>
     * @license MIT
     * @description This class provides core functionality for
     * client applications.
     */
    class OnixClient {
        /**
         * @constructor
         * @param config
         * @description Receives a client configuration, it will
         * also define a default value for our config incase is not
         * provided.
         */
        constructor(config) {
            this.config = config;
            this._schema = {}; // TODO Interface Schema
            this._references = {}; // Todo Reference Interface
            if (this.config.adapters.websocket && this.config.adapters.websocket) {
                this._http = new this.config.adapters.http();
            }
            else {
                console.log('ONIXJS SDK: Unable to find suitable adapters.');
            }
        }
        /**
         * @method init
         * @description this method will get the onix infrastructure schema
         * in order to correctly configure each Application Reference.
         */
        async init() {
            return new Promise(async (resolve, reject) => {
                this._schema = await this._http.get(`${this.config.host}:${this.config.port}`);
                resolve();
            });
        }
        async AppReference(name) {
            return new Promise(async (resolve, reject) => {
                if (!this._schema[name]) {
                    reject(new Error(`ONIX Client: Application with ${name} doesn't exist on the OnixJS Server Environment.`));
                }
                if (!this._references[name]) {
                    // Use passed host config if any
                    this._schema[name].host = this.config.host.replace(/http[s]{0,1}:\/\//, '');
                    this._references[name] = new core_1.AppReference(Object.assign({ name, client: new this.config.adapters.websocket() }, this._schema[name]));
                    await this._references[name].connect();
                }
                resolve(this._references[name]);
            });
        }
    }
    exports.OnixClient = OnixClient;
});
define("core/browser.adapters", ["require", "exports", "utils/index"], function (require, exports, utils_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Workaround to avoid naming issues
    const WS = WebSocket;
    /**
     * @namespace Browser
     * @author Jonathan Casarrubias
     * @description This namespace will provide adapters for
     * the SDK to work in Browser environments.
     */
    var Browser;
    (function (Browser) {
        /**
         * @class WebSocket
         * @author Jonathan Casarrubias
         * @description This class is used when the SDK is running in a
         * Browser Environment.
         */
        class WebSocket {
            connect(url) {
                this.connection = new WS(url);
            }
            on(name, callback) {
                switch (name) {
                    case 'message':
                        this.connection.onmessage = event => {
                            callback(utils_2.Utils.IsJsonString(event.data)
                                ? JSON.parse(event.data)
                                : event.data);
                        };
                        break;
                    default:
                        throw new Error(`ONIX Client: WebSocket event ${name} is not implemented.`);
                }
            }
            send(something) {
                this.connection.send(something);
            }
            open(callback) {
                this.connection.onopen = callback;
            }
        }
        Browser.WebSocket = WebSocket;
        /**
         * @class HTTP
         * @author Jonathan Casarrubias
         * @description This class is used when the SDK is running in a
         * Browser Environment.
         */
        class HTTP {
            async get(url) {
                return new Promise((resolve, reject) => {
                    const request = new XMLHttpRequest();
                    request.onreadystatechange = function () {
                        if (request.readyState === 4) {
                            resolve(JSON.parse(request.responseText));
                        }
                    };
                    request.open('GET', url, true);
                    request.send(null);
                });
            }
        }
        Browser.HTTP = HTTP;
    })(Browser = exports.Browser || (exports.Browser = {}));
});
define("core/nativescript.adapters", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    require('nativescript-websockets');
    const WS = WebSocket;
    const http = require('http');
    /**
     * @namespace Nativescript
     * @author Miguel Serrano
     * @description This namespace will provide adapters for the
     * SDK to work in a Nativescript environment,
     */
    var Nativescript;
    (function (Nativescript) {
        /**
         * @class WebSocket
         * @author Miguel Serrano
         * @description This class is used when the SDK is running in a
         * Nativescript Environment.
         */
        class WebSocket {
            connect(url) {
                this.connection = new WS(url, []);
            }
            on(name, callback) {
                switch (name) {
                    case 'message':
                        this.connection.addEventListener(name, evt => {
                            callback(evt.data);
                        });
                        break;
                    default:
                        throw new Error(`ONIX Client: WebSocket event ${name} is not implemented.`);
                }
            }
            send(something) {
                this.connection.send(something);
            }
            open(callback) {
                this.connection.addEventListener('open', callback);
            }
        }
        Nativescript.WebSocket = WebSocket;
        /**
         * @class HTTP
         * @author Miguel Serrano
         * @description This class is used when the SDK is running in a
         * Nativescript Environment.
         */
        class HTTP {
            async get(url) {
                return new Promise((resolve, reject) => {
                    http.request({ method: 'GET', url }).then(res => {
                        resolve(res.content.toJSON());
                        // Rehect on error
                    }, e => reject(e));
                });
            }
        }
        Nativescript.HTTP = HTTP;
    })(Nativescript = exports.Nativescript || (exports.Nativescript = {}));
});
define("core/node.adapters", ["require", "exports", "uws", "http", "https"], function (require, exports, UWS, http, https) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * @namespace NodeJS
     * @author Jonathan Casarrubias
     * @description This namespace will provide adapters for the
     * SDK to work in a NodeJS Environment,
     */
    var NodeJS;
    (function (NodeJS) {
        /**
         * @class WebSocket
         * @author Jonathan Casarrubias
         * @description This class is used when the SDK is running in a
         * NodeJS Environment.
         */
        class WebSocket {
            connect(url) {
                this.connection = new UWS(url);
            }
            on(name, callback) {
                this.connection.on(name, callback);
            }
            send(something) {
                this.connection.send(something);
            }
            open(callback) {
                this.connection.on('open', callback);
            }
        }
        NodeJS.WebSocket = WebSocket;
        /**
         * @class HTTP
         * @author Jonathan Casarrubias
         * @description This class is used when the SDK is running in a
         * NodeJS Environment.
         */
        class HTTP {
            async get(url) {
                return new Promise((resolve, reject) => {
                    const cb = res => {
                        res.setEncoding('utf8');
                        let body = '';
                        // Concatenate Response
                        res.on('data', data => (body += data));
                        // Resolve Call
                        res.on('end', () => resolve(JSON.parse(body)));
                        // Rehect on error
                    };
                    if (url.match(/https:\/\//)) {
                        https.get(url, cb).on('error', e => reject(e));
                    }
                    else {
                        http.get(url, cb).on('error', e => reject(e));
                    }
                });
            }
            async post(config, request) {
                return new Promise((resolve, reject) => {
                    // Set request options (Can be overrided from caller)
                    const options = Object.assign({
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    }, config);
                    // Create request object
                    const req = http.request(options, function (res) {
                        res.setEncoding('utf8');
                        let body = '';
                        // Concatenate Response
                        res.on('data', data => (body += data));
                        // Resolve Call
                        res.on('end', () => {
                            resolve(JSON.parse(body));
                        });
                        // Rehect on error
                    });
                    req.on('error', e => reject(e));
                    // write data to request body
                    req.write(JSON.stringify(request));
                    req.end();
                });
            }
        }
        NodeJS.HTTP = HTTP;
    })(NodeJS = exports.NodeJS || (exports.NodeJS = {}));
});
//# sourceMappingURL=browser.dist.js.map