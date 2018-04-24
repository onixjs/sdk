import {MethodReference} from './method.reference';
import {ModuleReference} from './module.reference';
/**
 * @class ModuleReference
 * @author Jonathan Casarrubias
 * @license MIT
 */
export class ComponentReference {
  private methods: {[key: string]: MethodReference} = {};
  constructor(public name: string, public moduleReference: ModuleReference) {}
  public Method(name: string): MethodReference {
    if (!this.methods[name])
      this.methods[name] = new MethodReference(name, this);
    return this.methods[name];
  }
}
