import {IAppRefConfig} from '../interfaces';
import {ModuleReference} from './module.reference';

export class AppReference {
  // modules
  public modules: {[key: string]: ModuleReference} = {};
  // Todo Client
  constructor(public readonly config: IAppRefConfig) {}
  // Module
  Module(name: string): ModuleReference {
    if (!this.modules[name])
      this.modules[name] = new ModuleReference(name, this);
    return this.modules[name];
  }
}
