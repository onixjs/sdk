OnixJS - Enterprise Grade Framework
================
[![Coverage Status](https://coveralls.io/repos/github/onixjs/core/badge.svg?branch=master)](https://coveralls.io/github/onixjs/core?branch=master) [![Travis](https://img.shields.io/travis/onixjs/core.svg)](https://travis-ci.org/onixjs/core) [![npm (scoped)](https://img.shields.io/npm/v/@onixjs/core.svg)](http://npmjs.com/package/@onixjs/core)


> **Disclaimer**: This framework is in active development and won't be ready for production until we reach release candidate.
 - **Alpha release date**: Feb 2018
 - **Estimated date for beta release**: May 15 2018
 - **Estimated date for release candidate**: EO2Q/2018

## Installation

````sh
$ npm install --save @onixjs/sdk
````

## Description
The OnixJS Client SDK is the result of [years of experience](https://www.npmjs.com/package/@mean-expert/loopback-sdk-builder) full of lessons, we understood that creating a coupled SDK to a specific front-end framework is such a bad idea, therefore we designed a pattern in order to create a new SDK that is able to run anywhere.

Now everybody is welcome, Angular? React? Vue? Stencil? RequiereJS? Electron? NativeScript? ReactNative? you name it, use it in any framework you want.

## OnixJS Client SDK Example

```js
import { OnixClient, ComponentReference, AppReference} from '@onixjs/sdk';
import { Browser } from '@onixjs/sdk/dist/adapters/browser.adapters';

const sdk: OnixClient = new OnixClient({
    host: 'http://127.0.0.1',
    port: 9000,
    adapters: {
      http: Browser.HTTP,
      websocket: Browser.WebSocket,
      storage: Browser.LocalStorage
    }
});

let componentRef: ComponentReference;

// Initialize the SDK
await this.sdk.init();
// Create an Application Reference
const myApp: AppReference | Error = this.sdk.AppReference('MyApp');
// Verify we got a valid AppReference, else throw the error.
if (myApp instanceof AppReference) {
  // Create Component Reference
  this.componentRef = todoApp.Module('TodoModule').Component('TodoComponent');
  // Create a listTodos stream reference
  componentRef.Method('myStream').stream((data) => {
    console.log(myData);
  });
} else {
  throw myApp;
}

await componentRef.Method('myRPC').call({ text: input.value });
```

The example above is a general implementation of the OnixJS Client SDK, but we definitely recommend you to spend some time checking out the examples in different front-end frameworks we built for you:

### Web
- [Angular](https://github.com/onixjs/examples/tree/master/onixjs-ng)
- [React](https://github.com/onixjs/examples/tree/master/onixjs-react)
- [VueJS](https://github.com/onixjs/examples/tree/master/onixjs-vue)
- [StencilJS](https://github.com/onixjs/examples/tree/master/onixjs-stencil)

### Desktop
- [Electron](https://github.com/onixjs/examples/tree/master/onixjs-electron)

### Mobile
- [NativeScript](https://github.com/onixjs/examples/tree/master/onixjs-nativescript)
- [ReactNative](https://github.com/onixjs/examples/tree/master/onixjs-reactnative)

## Core Documentation

A more complete documentation can be found within the [Core Documentation](https://github.com/onixjs/core/wiki).

## Contributors

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
| [<img src="https://avatars0.githubusercontent.com/u/1533239?v=3" width="100px;"/><br /><sub>Jonathan Casarrubias</sub>](http://mean.expert/)<br />[💻](https://github.com/onixjs/core/commits?author=jonathan-casarrubias) | [<img src="https://avatars1.githubusercontent.com/u/12107518?v=3" width="100px;"/><br /><sub>Andres David Jimenez</sub>](https://plus.google.com/+AndresJimenezS/posts)<br />[💡](https://github.com/onixjs/examples/commits?author=kattsushi) | [<img src="https://avatars0.githubusercontent.com/u/40091?s=460&v=4" width="100px;"/><br /><sub>Paul Warelis</sub>](https://github.com/pwarelis)<br />[📖](https://github.com/onixjs/core/commits?author=pwarelis) | [<img src="https://avatars0.githubusercontent.com/u/17414885?s=460&v=4" width="100px;"/><br /><sub>Miguel Serrano</sub>](https://github.com/Serranom4)<br />[💻](https://github.com/onixjs/sdk/commits?author=Serranom4)[💡](https://github.com/onixjs/examples/commits?author=Serranom4) | [<img src="https://avatars1.githubusercontent.com/u/2659407?s=460&v=4" width="100px;"/><br /><sub>Ixshel Escamilla</sub>](https://github.com/ixshelescamilla)<br />[📋](https://github.com/onixjs)[🔍](https://github.com/onixjs) | [<img src="https://avatars0.githubusercontent.com/u/7293874?s=460&v=4" width="100px;"/><br /><sub>Raul Vargas</sub>](https://github.com/raul26)<br />[🔌](https://github.com/onixjs/vcode/commits?author=raul26) |
| :---: | :---: | :---: | :---: | :---: | :---: |
<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/kentcdodds/all-contributors) specification. Contributions of any kind welcome!


[OnixJS]: http://onixjs.io
[Factories]: https://en.wikipedia.org/wiki/Factory_method_pattern
[Factory Methid]: https://en.wikipedia.org/wiki/Factory_method_pattern
[OIDC]: http://openid.net/connect/
[Isomorphic]: https://en.wikipedia.org/wiki/Isomorphic_JavaScript
[SDK]: https://github.com/onixjs/sdk
