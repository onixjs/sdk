import {ComponentReference} from './component.reference';
import {AppReference} from './app.reference';
/**
 * @class ModuleReference
 * @author Jonathan Casarrubias
 * @license MIT
 */
export class ModuleReference {
  // components
  private components: {[key: string]: ComponentReference} = {};
  constructor(public name: string, public appReference: AppReference) {}
  public Component(name: string): ComponentReference {
    if (!this.components[name])
      this.components[name] = new ComponentReference(name, this);
    return this.components[name];
  }
}
