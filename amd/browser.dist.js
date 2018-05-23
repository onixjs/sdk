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
define("core/listener.collection", ["require", "exports", "interfaces/index"], function (require, exports, interfaces_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * @class ListenerCollection
     * @author Jonathan Casarrubias
     * @license MIT
     * @description This class is a memory database
     * that will store listeners from across the onixjs
     * platform.
     */
    class ListenerCollection {
        constructor() {
            /**
             * @prop ns
             * @description This is the current
             * database namespace, should be modified by
             * executing the namespace method before any
             * other procedure.
             */
            this.ns = 'default';
            /**
             * @prop namespaces
             * @description This is a list of used namespaces
             * will be used mainly when destroying this collection.
             */
            this.nss = {};
            /**
             * @prop listeners
             * @description In memory collection, contains
             * all the listeners registered within this context.
             */
            this.listeners = {};
        }
        /**
         * @method namespace
         * @param ns
         * @description This method will assign a namespace.
         * Should be executed
         */
        namespace(ns) {
            this.nss[ns] = true;
            this.ns = ns;
            return this;
        }
        /**
         * @method namespaces
         * @param ns
         * @description This method returns a list of namespaces
         */
        namespaces() {
            return Object.keys(this.nss);
        }
        /**
         * @method add
         * @param listener
         * @description This method will add a listener into
         * the current namespace database
         */
        add(listener) {
            if (!this.listeners[this.ns]) {
                this.listeners[this.ns] = new interfaces_1.ListenerCollectionList();
            }
            else {
                this.listeners[this.ns].index += 1;
            }
            this.listeners[this.ns].collection[this.listeners[this.ns].index] = listener;
            return this.listeners[this.ns].index;
        }
        /**
         * @method remove
         * @param index
         * @description This method will remove a listener from the
         * current namespace.
         */
        remove(index) {
            if (this.listeners[this.ns].collection[index])
                delete this.listeners[this.ns].collection[index];
        }
        /**
         * @method broadcast
         * @param handler
         * @description will iterate over a collection list of listeners
         * depending on the current namespace and propagate the received data.
         */
        broadcast(data) {
            Object.keys(this.listeners[this.ns].collection).forEach(index => this.listeners[this.ns].collection[index](data));
        }
    }
    exports.ListenerCollection = ListenerCollection;
});
define("core/client.registration", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ClientRegistration {
        constructor(uuid) {
            this.uuid = uuid;
        }
    }
    exports.ClientRegistration = ClientRegistration;
});
define("enums/index", ["require", "exports"], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("interfaces/index", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ListenerCollectionList {
        constructor() {
            this.index = 0;
            this.collection = {};
        }
    }
    exports.ListenerCollectionList = ListenerCollectionList;
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
define("core/unsubscribe", ["require", "exports", "utils/index"], function (require, exports, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * @class Unsubscribe
     * @author Jonathan Casarrubias
     * @license MIT
     * @description This class will provide a way
     * to unsubscribe a stream from the server.
     */
    class Unsubscribe {
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
        constructor(id, operation, config) {
            this.id = id;
            this.operation = operation;
            this.config = config;
        }
        /**
         * @method unsubscribe
         * @description This async method will resolve once the server
         * successfully unsubscribes the client from the configured
         * stream operation.
         */
        async unsubscribe() {
            return new Promise((resolve, reject) => {
                // Create unsubscribe app operation
                const operation = {
                    uuid: utils_1.Utils.uuid(),
                    type: 15 /* ONIX_REMOTE_CALL_STREAM_UNSUBSCRIBE */,
                    message: {
                        rpc: 'unsubscribe',
                        request: {
                            metadata: {
                                stream: false,
                                subscription: this.config.registration.uuid,
                            },
                            payload: this.operation,
                        },
                    },
                };
                // Create a listener for this unsubscription, it will be removed
                // once the server finish with the back process.
                const id = this.config.listeners.add((response) => {
                    if (response.uuid === operation.uuid &&
                        response.type ===
                            16 /* ONIX_REMOTE_CALL_STREAM_UNSUBSCRIBE_RESPONSE */) {
                        // Remove unsubscribe listener
                        this.config.listeners.remove(id);
                        // Remove original stream listener
                        this.config.listeners.remove(this.id);
                        // Resolve promise
                        resolve();
                    }
                });
                // Communicate the server that we want to get rid of this stream subscription
                this.config.client.send(JSON.stringify(operation));
            });
        }
    }
    exports.Unsubscribe = Unsubscribe;
});
define("core/method.reference", ["require", "exports", "utils/index", "core/unsubscribe"], function (require, exports, utils_2, unsubscribe_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * @class ModuleReference
     * @author Jonathan Casarrubias
     * @license MIT
     */
    class MethodReference {
        /**
         * @constructor
         * @param name
         * @param componentReference
         */
        constructor(name, componentReference) {
            this.name = name;
            this.componentReference = componentReference;
        }
        /**
         * @method call
         * @param payload
         * @description This method will call for RPC endpoints. It will send an application operation
         * to the OnixJS Service HOST.
         */
        async call(payload, filter) {
            return new Promise((resolve, reject) => {
                if (this.invalid('rpc')) {
                    reject(new Error(`ONIXJS CLIENT: Unable to call ${this.endpoint()}, RPC doesn't exist on OnixJS Server`));
                }
                else {
                    const operation = {
                        uuid: utils_2.Utils.uuid(),
                        type: 13 /* ONIX_REMOTE_CALL_PROCEDURE */,
                        message: {
                            rpc: this.endpoint(),
                            request: {
                                metadata: {
                                    filter,
                                    stream: false,
                                    caller: this.componentReference.moduleReference.appReference
                                        .config.claims.sub,
                                    token: this.componentReference.moduleReference.appReference
                                        .config.token,
                                    subscription: this.componentReference.moduleReference
                                        .appReference.config.registration.uuid,
                                },
                                payload,
                            },
                        },
                    };
                    const listenerId = this.componentReference.moduleReference.appReference.config.listeners.add((response) => {
                        if (response.uuid === operation.uuid &&
                            response.type ===
                                14 /* ONIX_REMOTE_CALL_PROCEDURE_RESPONSE */) {
                            this.componentReference.moduleReference.appReference.config.listeners.remove(listenerId);
                            resolve(response.message.request.payload);
                        }
                        // TODO ADD TIMEOUT RESPONSE HERE
                    });
                    // Send Operation to Server
                    this.componentReference.moduleReference.appReference.config.client.send(JSON.stringify(operation));
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
        stream(listener, filter) {
            if (this.invalid('stream')) {
                listener(new Error(`ONIXJS CLIENT: Unable to call ${this.endpoint()}, RPC doesn't exist on OnixJS Server`));
            }
            else {
                const operation = {
                    uuid: utils_2.Utils.uuid(),
                    type: 13 /* ONIX_REMOTE_CALL_PROCEDURE */,
                    message: {
                        rpc: this.endpoint(),
                        request: {
                            metadata: {
                                filter,
                                stream: true,
                                caller: this.componentReference.moduleReference.appReference
                                    .config.claims.sub,
                                token: this.componentReference.moduleReference.appReference.config
                                    .token,
                                subscription: this.componentReference.moduleReference.appReference
                                    .config.registration.uuid,
                            },
                            payload: undefined,
                        },
                    },
                };
                // Register Stream
                this.componentReference.moduleReference.appReference.config.client.send(JSON.stringify(operation));
                // Chunks of information will be received in a future
                const id = this.componentReference.moduleReference.appReference.config.listeners.add((response) => {
                    if (response.uuid === operation.uuid &&
                        response.type === 12 /* ONIX_REMOTE_CALL_STREAM */) {
                        listener(response.message.request.payload);
                    }
                });
                return new unsubscribe_1.Unsubscribe(id, operation, this.componentReference.moduleReference.appReference.config);
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
});
define("core/component.reference", ["require", "exports", "core/method.reference"], function (require, exports, method_reference_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * @class ModuleReference
     * @author Jonathan Casarrubias
     * @license MIT
     */
    class ComponentReference {
        constructor(name, moduleReference) {
            this.name = name;
            this.moduleReference = moduleReference;
            this.methods = {};
        }
        Method(name) {
            if (!this.methods[name])
                this.methods[name] = new method_reference_1.MethodReference(name, this);
            return this.methods[name];
        }
    }
    exports.ComponentReference = ComponentReference;
});
define("core/module.reference", ["require", "exports", "core/component.reference"], function (require, exports, component_reference_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * @class ModuleReference
     * @author Jonathan Casarrubias
     * @license MIT
     */
    class ModuleReference {
        constructor(name, appReference) {
            this.name = name;
            this.appReference = appReference;
            // components
            this.components = {};
        }
        Component(name) {
            if (!this.components[name])
                this.components[name] = new component_reference_1.ComponentReference(name, this);
            return this.components[name];
        }
    }
    exports.ModuleReference = ModuleReference;
});
define("core/app.reference", ["require", "exports", "core/module.reference"], function (require, exports, module_reference_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class AppReference {
        // Todo Client
        constructor(config) {
            this.config = config;
            // modules
            this.modules = {};
        }
        // Module
        Module(name) {
            if (!this.modules[name])
                this.modules[name] = new module_reference_1.ModuleReference(name, this);
            return this.modules[name];
        }
    }
    exports.AppReference = AppReference;
});
define("core/index", ["require", "exports", "core/app.reference", "core/module.reference", "core/component.reference", "core/method.reference", "core/listener.collection"], function (require, exports, app_reference_1, module_reference_2, component_reference_2, method_reference_2, listener_collection_1) {
    "use strict";
    function __export(m) {
        for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
    }
    Object.defineProperty(exports, "__esModule", { value: true });
    __export(app_reference_1);
    __export(module_reference_2);
    __export(component_reference_2);
    __export(method_reference_2);
    exports.ListenerCollection = listener_collection_1.ListenerCollection;
});
define("index", ["require", "exports", "core/app.reference", "utils/index", "core/listener.collection", "core/client.registration", "core/index", "enums/index", "interfaces/index"], function (require, exports, app_reference_2, utils_3, listener_collection_2, client_registration_1, core_1, enums_1, interfaces_2) {
    "use strict";
    function __export(m) {
        for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
    }
    Object.defineProperty(exports, "__esModule", { value: true });
    __export(core_1);
    __export(enums_1);
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
            this.listeners = new listener_collection_2.ListenerCollection();
            this.schema = {}; // TODO Interface Schema
            this.references = {}; // Todo Reference Interface
            if (this.config.adapters.http &&
                this.config.adapters.websocket &&
                this.config.adapters.storage) {
                this.http = new this.config.adapters.http();
                this.ws = new this.config.adapters.websocket();
                this.storage = new this.config.adapters.storage();
                if (!this.config.prefix) {
                    this.config.prefix = 'onixjs.sdk';
                }
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
                // Get OnixJS Schema
                this.schema = await this.http.get(`${this.config.host}:${this.config.port}/.well-known/onixjs-schema`);
                // URL
                const url = `${this.config.port === 443 ? 'wss' : 'ws'}://${this.config.host.replace(/http[s]{0,1}:\/\//, '')}:${this.config.port}`;
                // Connect WebSocket
                this.ws.connect(url);
                // Register Single WS Listener
                this.ws.on('message', (data) => this.listeners.broadcast(utils_3.Utils.IsJsonString(data) ? JSON.parse(data) : data));
                // When connection is open then register and resolve
                this.ws.open(() => this.register(resolve, reject));
            });
        }
        /**
         * @method
         * @param resolve
         */
        register(resolve, reject) {
            const uuid = utils_3.Utils.uuid();
            // Register Client
            const operation = {
                uuid,
                type: 17 /* ONIX_REMOTE_REGISTER_CLIENT */,
                message: {
                    rpc: 'register',
                    request: {
                        metadata: {
                            stream: false,
                            subscription: uuid,
                        },
                        payload: {},
                    },
                },
            };
            // Create listener
            const index = this.listeners.add((data) => {
                // Verify we actually get an object
                const response = (typeof data ===
                    'string' && utils_3.Utils.IsJsonString(data)
                    ? JSON.parse(data)
                    : data);
                // Verify we got the result, which will provide the registration
                // Later might be used on handled disconnections.
                if (response.uuid === operation.uuid &&
                    response.type === 18 /* ONIX_REMOTE_REGISTER_CLIENT_RESPONSE */) {
                    if (response.message.request.payload.code &&
                        response.message.request.payload.message) {
                        reject(response.message.request.payload);
                    }
                    else {
                        this.registration = new client_registration_1.ClientRegistration(uuid);
                        this.listeners.remove(index);
                        resolve();
                    }
                }
            });
            // Send registration operation
            this.ws.send(JSON.stringify(operation));
        }
        /**
         * @method disconnect
         * @description Disconnect from websocket server
         */
        disconnect() {
            this.ws.close();
        }
        /**
         * @class AppReference
         * @param name
         * @description This method will construct an application reference.
         * Only if the provided schema defines it does exist.
         */
        async AppReference(name) {
            // Verify that the application actually exists on server
            if (!this.schema[name]) {
                return new Error(`ONIX Client: Application with ${name} doesn't exist on the OnixJS Server Environment.`);
            }
            // If the reference still doesn't exist, then create one
            if (!this.references[name]) {
                // Use passed host config if any
                this.references[name] = new app_reference_2.AppReference(Object.assign({
                    name,
                    client: this.ws,
                    token: this.token,
                    claims: await this.claims(),
                    listeners: this.listeners,
                    registration: this.registration,
                }, this.schema[name]));
            }
            // Otherwise return a singleton instance of the reference
            return this.references[name];
        }
        /**
         * @description This setter will store a provided access token
         * into the local storage adapter.
         */
        set token(token) {
            this.storage.setItem(`${this.config.prefix}:access_token`, token);
        }
        /**
         * @description This getter will return a stored access token
         * from the local storage adapter.
         */
        get token() {
            return this.storage.getItem(`${this.config.prefix}:access_token`) || '';
        }
        /**
         * @method claims
         * @author Jonathan Casarrubias
         * @description This method will return an OIDC claims object.
         * Usually will provide the user information and any scope
         * defined within the OIDC Client.
         */
        async claims() {
            // Load claims from local storage
            const persisted = this.storage.getItem(`${this.config.prefix}:claims`);
            // Verify that we already have an actual claims
            if (persisted) {
                return JSON.parse(persisted);
            }
            // Otherwise verify we actually have an access_token
            if (this.token.length > 0) {
                // Now call from the SSO the user claims
                const claims = await this.http.get(`https://sso.onixjs.io/me?access_token=${this.token}`);
                // Store now in localstorage
                this.storage.setItem(`${this.config.prefix}:claims`, JSON.stringify(claims));
                // Return the claims
                return claims;
            }
            else {
                // This guy is not even logged, return an anonymous claim
                return { sub: '$anonymous' };
            }
        }
        /**
         * @method logout
         * @description this method will clear the local storage, therefore
         * cleaning any stored information like token or claims.
         */
        logout() {
            this.storage.clear();
        }
    }
    exports.OnixClient = OnixClient;
});
define("adapters/browser.adapters", ["require", "exports", "utils/index"], function (require, exports, utils_4) {
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
                            callback(utils_4.Utils.IsJsonString(event.data)
                                ? JSON.parse(event.data)
                                : event.data);
                        };
                        break;
                    case 'close':
                        this.connection.onclose = callback;
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
            close() {
                this.connection.close();
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
        /**
         * @class LocalStorage
         * @author Jonathan Casarrubias
         * @description This class is used when the SDK is running in a
         * Browser Environment.
         */
        class LocalStorage {
            setItem(key, value) {
                localStorage.setItem(key, value);
            }
            getItem(key) {
                return localStorage.getItem(key);
            }
            removeItem(key) {
                localStorage.removeItem(key);
            }
            clear() {
                localStorage.clear();
            }
        }
        Browser.LocalStorage = LocalStorage;
    })(Browser = exports.Browser || (exports.Browser = {}));
});
define("adapters/nativescript.adapters", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const appSettings = require('application-settings');
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
            close() {
                this.connection.close();
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
        /**
         * @class LocalStorage
         * @author Miguel Serrano
         * @description This class is used when the SDK is running in a
         * Nativescript Environment.
         */
        class LocalStorage {
            setItem(key, value) {
                appSettings.setString(key, value);
            }
            getItem(key) {
                return appSettings.getString(key);
            }
            removeItem(key) {
                appSettings.remove(key);
            }
            clear() {
                appSettings.clear();
            }
        }
        Nativescript.LocalStorage = LocalStorage;
    })(Nativescript = exports.Nativescript || (exports.Nativescript = {}));
});
define("adapters/node.adapters", ["require", "exports", "ws", "http", "https", "utils/index", "node-localstorage"], function (require, exports, WS, http, https, utils_5, node_localstorage_1) {
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
                this.connection = new WS(url);
            }
            on(name, callback) {
                switch (name) {
                    case 'close':
                        this.connection.onclose = callback;
                        break;
                    default:
                        this.connection.on(name, callback);
                }
            }
            send(something) {
                this.connection.send(something);
            }
            open(callback) {
                this.connection.on('open', callback);
            }
            close() {
                this.connection.close();
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
                        res.on('end', () => resolve(utils_5.Utils.IsJsonString(body) ? JSON.parse(body) : body));
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
                            resolve(utils_5.Utils.IsJsonString(body) ? JSON.parse(body) : body);
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
        /**
         * @class LocalStorage
         * @author Jonathan Casarrubias
         * @description This class is used when the SDK is running in a
         * NodeJS Environment.
         *
         * npm install node-localstorage
         */
        class LocalStorage {
            constructor() {
                this.localStorage = new node_localstorage_1.LocalStorage('sdk:storage');
            }
            setItem(key, value) {
                this.localStorage.setItem(key, value);
            }
            getItem(key) {
                return this.localStorage.getItem(key);
            }
            removeItem(key) {
                this.localStorage.removeItem(key);
            }
            clear() {
                this.localStorage.clear();
            }
        }
        NodeJS.LocalStorage = LocalStorage;
    })(NodeJS = exports.NodeJS || (exports.NodeJS = {}));
});
//# sourceMappingURL=browser.dist.js.map