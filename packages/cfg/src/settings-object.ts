import * as util from 'util';
import { EventEmitter } from './event-emitter';
import { ConfigItem } from './shared/types';

type EventMap = {
  changed: (configItem: ConfigItem, prevValue: any) => void;
  set: (configItem: ConfigItem) => void;
};

export class SettingsObject extends EventEmitter<EventMap> {
  toJSON() {
    return Object.fromEntries(
      this.getEntries().map(([key, value]) => [key, value]),
    );
  }

  toString() {
    return JSON.stringify(
      Object.fromEntries(this.getEntries().map(([key, value]) => [key, value])),
    );
  }

  [util.inspect.custom]() {
    return JSON.stringify(
      Object.fromEntries(this.getEntries().map(([key, value]) => [key, value])),
    );
  }

  private isProperty(key: string) {
    if ((this as any)[key] instanceof SettingsObject) {
      return true;
    }
    const descriptor = Object.getOwnPropertyDescriptor(this, key);
    return descriptor?.get && descriptor?.set;
  }

  private getEntries() {
    return Object.entries(this).filter(([key]) => this.isProperty(key));
  }
}
