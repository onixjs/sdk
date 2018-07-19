import {InterceptFunction} from '../interfaces';
/**
 * @class Interceptors
 * @description This class will statically contain
 * interceptors, it won't be exposed to final developers
 * but it will be internally used.
 */
export class Interceptors {
  public static before: InterceptFunction;
  public static after: InterceptFunction;
}
/**
 * @class Interceptor
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This class will register
 * interception methods that will be executed before
 * and after every RPC or STREAM call
 */
export class Interceptor {
  /**
   * @method before
   * @param handler
   * @description register a handler that will be executed
   * before every RPC or STREAM Call.
   */
  public static before(handler: InterceptFunction) {
    Interceptors.before = handler;
  }
  /**
   * @method after
   * @param handler
   * @description register a handler that will be executed
   * after every RPC or STREAM Call.
   */
  public static after(handler: InterceptFunction) {
    Interceptors.after = handler;
  }
}
