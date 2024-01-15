import {
  ConfigDefinitions,
  ConfigItem,
  ConfigSettings,
  ConfigValueType,
} from './shared/types';
import { SettingsObject } from './settings-object';
import { ValueProvider } from './value-provider';
import { EnvValueProvider } from './env-value-provider';
import { deepEqual } from './shared/deep-equal';

const NO_TAG = 'no-tag-was-set';

export type Settings<T extends ConfigDefinitions<T>> = ConfigSettings<T> &
  Omit<SettingsObject, 'toString' | 'toJSON' | '[unknown]' | 'listeners'> & {
    load: (...providers: ValueProvider[]) => Promise<void>;
  };

export class Cfg extends SettingsObject {
  private items: ConfigItem[] = [];

  private itemsMap = new Map<string, ConfigItem>();

  static set<T extends ConfigDefinitions<T>>(config: T): Settings<T> {
    const cfg = new Cfg();
    cfg.parseConfigItems(config);
    cfg.load(new EnvValueProvider());
    return cfg.parseConfigSettings() as any as Settings<T>;
  }

  async load(...providers: ValueProvider[]) {
    const groups = this.groupItemsByTag();
    const loadedItems = new Map<ConfigItem, ConfigItem | null>();

    for (const configItem of this.items) {
      loadedItems.set(configItem, null);
    }

    const notTaggedItems = groups.get(NO_TAG) || [];

    const loadItemsFromProvider = (
      unloadedItems: ConfigItem[],
      provider: ValueProvider,
    ) => new Promise<void>(async (resolve, reject) => {
        let handler: any;
        try {
          handler = provider.on('loaded', (providedItems) => {
            for (const { requestedItem, providedItem } of providedItems) {
              loadedItems.set(requestedItem, providedItem);
            }
            resolve();
          });

          await provider.load(unloadedItems);
        } catch (e) {
          reject(e);
        } finally {
          if (handler) {
            provider.off('loaded', handler);
          }
        }
      });

    for (const provider of providers) {
      provider.off('loaded', this.updateLoadedItems);
      provider.on('loaded', this.updateLoadedItems);
      const taggedItems = provider.tag ? groups.get(provider.tag) ?? [] : [];
      const items = [...notTaggedItems, ...taggedItems];

      if (items.length > 0) {
        const unloadedItems = items.filter(
          (configItem) => loadedItems.get(configItem) === null,
        );
        await loadItemsFromProvider(unloadedItems, provider);
      }
    }
  }

  private parseConfigItems(config: { [key: string]: any }, rootName?: string) {
    Object.entries(config).forEach(([name, configItem]) => {
      if (Object.hasOwn(configItem, 'default')) {
        const defaultValue = this.valueTypeTransformer(
          configItem.default,
          configItem.type,
        );

        const parsedItem = {
          code: configItem.code,
          name: [rootName, name].filter((item) => item).join(':'),
          default: defaultValue,
          value: defaultValue,
          envName: configItem.envName,
          tags: configItem.tags ?? [],
          type: configItem.type,
        };

        this.items.push(parsedItem);
        this.itemsMap.set(parsedItem.name, parsedItem);
      } else {
        this.parseConfigItems(configItem, name);
      }
    });
  }

  private parseConfigSettings() {
    // eslint-disable-next-line consistent-this
    const root = this;

    this.items.forEach((configItem) => {
      const { container, key } = this.getItemInfo(root, configItem);
      Object.defineProperty(container, key, {
        configurable: false,
        enumerable: true,
        get(): any {
          return configItem.value;
        },
        async set(newValue: any) {
          if (configItem) {
            const prevValue = configItem.value;
            configItem.value = newValue;

            await root.emit('set', { ...configItem });
            if (!deepEqual(prevValue, newValue)) {
              await root.emit('changed', { ...configItem }, prevValue);
            }
          }
        },
      });
    });
    return this;
  }

  private getItemInfo(root: SettingsObject, configItem: ConfigItem) {
    const anyRoot = root as any;
    const path = configItem.name.split(':');

    let container;
    for (let i = 0; i < path.length - 1; ++i) {
      const key = path[i];
      if (!anyRoot[key]) {
        anyRoot[key] = new SettingsObject();
      }
      container = anyRoot[key];
    }
    return { container: container ?? root, key: path[path.length - 1] };
  }

  private updateLoadedItems = async (
    loadedItems: {
      requestedItem: ConfigItem;
      providedItem: ConfigItem | null;
    }[],
  ) => {
    for (const { requestedItem, providedItem } of loadedItems) {
      const internalItem = this.itemsMap.get(requestedItem.name);
      if (internalItem && providedItem) {
        const prevValue = internalItem.value;
        const internalName = internalItem.name;
        Object.assign(internalItem, providedItem);

        internalItem.name = internalName;
        internalItem.value = this.valueTypeTransformer(
          internalItem.value,
          internalItem.type,
        );

        await this.emit('set', internalItem);
        if (!deepEqual(prevValue, internalItem.value)) {
          await this.emit('changed', internalItem, prevValue);
        }
      }
    }
  };

  private valueTypeTransformer(rawValue: any, type: ConfigValueType) {
    const isType = (value: any, valueType: string) => (
      // eslint-disable-next-line valid-typeof
        value === null || value === undefined || typeof value === valueType
      );
    switch (type) {
      case 'integer':
        return typeof rawValue === 'number'
          ? Math.trunc(rawValue)
          : Math.trunc(Number(rawValue));
      case 'float':
        return isType(rawValue, 'number') ? rawValue : Number(rawValue);
      case 'string':
        return isType(rawValue, 'string') ? rawValue : rawValue.toString();
      case 'json':
        return isType(rawValue, 'object') ? rawValue : JSON.parse(rawValue);
      case 'boolean':
        return isType(rawValue, 'boolean') ? rawValue : rawValue === 'true';
    }
  }

  private groupItemsByTag() {
    const groups = new Map<string, ConfigItem[]>();
    for (const item of this.items) {
      if (item.tags && item.tags.length > 0) {
        for (const tag of item.tags) {
          const groupedItems = groups.get(tag) ?? [];
          groupedItems.push(item);
          groups.set(tag, groupedItems);
        }
      } else {
        const groupedItems = groups.get(NO_TAG) ?? [];
        groupedItems.push(item);
        groups.set(NO_TAG, groupedItems);
      }
    }
    return groups;
  }
}
