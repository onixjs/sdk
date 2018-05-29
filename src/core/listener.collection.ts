import {ListenerCollectionList, Listener} from '../interfaces';
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
  private ns: string = 'default';
  /**
   * @prop namespaces
   * @description This is a list of used namespaces
   * will be used mainly when destroying this collection.
   */
  private nss: {[ns: string]: boolean} = {};
  /**
   * @prop listeners
   * @description In memory collection, contains
   * all the listeners registered within this context.
   */
  private listeners: {
    [namespace: string]: ListenerCollectionList;
  } = {};
  /**
   * @method namespace
   * @param ns
   * @description This method will assign a namespace.
   * Should be executed
   */
  public namespace(ns: string) {
    this.nss[ns] = true;
    this.ns = ns;
    return this;
  }
  /**
   * @method namespaces
   * @param ns
   * @description This method returns a list of namespaces
   */
  public namespaces() {
    return Object.keys(this.nss);
  }
  /**
   * @method add
   * @param listener
   * @description This method will add a listener into
   * the current namespace database
   */
  add(listener: Listener): number {
    if (!this.listeners[this.ns]) {
      this.listeners[this.ns] = new ListenerCollectionList();
    } else {
      this.listeners[this.ns].index += 1;
    }
    this.listeners[this.ns].collection[
      this.listeners[this.ns].index
    ] = listener;
    return this.listeners[this.ns].index;
  }
  /**
   * @method remove
   * @param index
   * @description This method will remove a listener from the
   * current namespace.
   */
  remove(index): void {
    if (
      this.listeners[this.ns] &&
      this.listeners[this.ns].collection &&
      this.listeners[this.ns].collection[index]
    ) {
      delete this.listeners[this.ns].collection[index];
    }
  }
  /**
   * @method broadcast
   * @param handler
   * @description will iterate over a collection list of listeners
   * depending on the current namespace and propagate the received data.
   */
  broadcast(data): void {
    if (this.listeners[this.ns] && this.listeners[this.ns].collection) {
      Object.keys(this.listeners[this.ns].collection).forEach(index =>
        this.listeners[this.ns].collection[index](data),
      );
    }
  }
  /**
   * @method forEach
   * @param handler
   * @description will iterate over a collection list of listeners
   * depending on the current namespace and propagate the received data.
   */
  forEach(handler): void {
    if (this.listeners[this.ns] && this.listeners[this.ns].collection) {
      Object.keys(this.listeners[this.ns].collection).forEach(index =>
        handler(this.listeners[this.ns].collection[index]),
      );
    }
  }
  /**
   * @method removeNameSpaceListeners
   * @description This method will remove any listener from every
   * collection from any namespace.
   */
  removeNameSpaceListeners(namespace: string) {
    if (this.listeners[this.ns] && this.listeners[this.ns].collection) {
      Object.keys(this.listeners[namespace].collection).forEach(key => {
        this.namespace(namespace).remove(key);
      });
    }
  }
  /**
   * @method removeAllListeners
   * @description This method will remove any listener from every
   * collection from any namespace.
   */
  removeAllListeners() {
    this.namespaces().forEach(namespace => {
      Object.keys(this.listeners[namespace].collection).forEach(key => {
        this.namespace(namespace).remove(key);
      });
    });
  }
}
