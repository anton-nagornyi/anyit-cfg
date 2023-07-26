import { ValueProvider } from './value-provider';
import { ConfigItem } from './shared/types';

export class EnvValueProvider extends ValueProvider {
  load(configItems: ConfigItem[]) {
    return this.emit(
      'loaded',
      configItems.map((configItem) => {
        const envName = configItem.envName ?? this.getEnvName(configItem.name);

        if (!process.env[envName]) {
          return {
            requestedItem: configItem,
            providedItem: null,
          };
        }

        return {
          requestedItem: configItem,
          providedItem: {
            ...configItem,
            envName,
            value: process.env[envName] ?? configItem.default,
          },
        };
      }),
    );
  }

  private getEnvName(name: string) {
    const nameWithoutPrefix = name
      .split(':')
      .map((part) => this.convertCamelToUpperCase(part))
      .join('_');

    return `CFG_${nameWithoutPrefix}`;
  }

  private convertCamelToUpperCase(str: string) {
    return str.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase();
  }
}
