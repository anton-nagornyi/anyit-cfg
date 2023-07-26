import { ConfigItem } from './shared/types';
import { EventEmitter } from './event-emitter';

type EventMap = {
  loaded: (
    loadedItems: {
      requestedItem: ConfigItem;
      providedItem: ConfigItem | null;
    }[],
  ) => void;
};

export type ValueProviderArgs = {
  tag?: string;
};

export abstract class ValueProvider extends EventEmitter<EventMap> {
  constructor(args?: ValueProviderArgs) {
    super();

    this.providerTag = args?.tag ?? null;
  }

  private readonly providerTag: string | null;

  abstract load(configItems: ConfigItem[]): Promise<void> | void;

  get tag(): string | null {
    return this.providerTag;
  }
}
