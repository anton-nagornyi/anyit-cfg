import {
  ConfigItem,
  ValueProvider,
  ValueProviderArgs,
  ValueProviderTrigger,
} from '@anyit/cfg';
import {
  DataSource,
  FindOptionsWhere,
  In,
  IsNull,
  MoreThan,
  Repository,
} from 'typeorm';
import { Config } from './config';
import { ConfigModel } from './models/config-model';
import { ValidationError } from './errors/validation-error';

export type TypeormValueProviderArgs = {
  dataSource: DataSource;
  createMissingItems?: boolean;
  trigger?: ValueProviderTrigger;
  serviceName?: string;
  serviceVersion?: string;
} & ValueProviderArgs;

export class TypeormValueProvider extends ValueProvider {
  constructor({
    dataSource,
    trigger,
    tag,
    createMissingItems = true,
    serviceName = Config.serviceName,
    serviceVersion = Config.serviceVersion,
  }: TypeormValueProviderArgs) {
    super({ tag });

    this.config = dataSource.getRepository(ConfigModel);

    this.serviceName = serviceName;
    this.serviceVersion = serviceVersion;
    this.createMissingItems = createMissingItems;

    this.trigger = trigger;
    if (this.trigger) {
      this.trigger.on('update', () =>
        this.loadConfigItems(
          this.configItems,
          {
            changesCheck: MoreThan(this.maxDate),
          },
          true,
        ),
      );
    }
  }

  private readonly serviceName: string;

  private readonly serviceVersion: string;

  private readonly config: Repository<ConfigModel>;

  private readonly trigger?: ValueProviderTrigger;

  private readonly createMissingItems: boolean;

  private configItems: ConfigItem[] = [];

  private maxDate: Date = new Date(0);

  async load(inputItems: ConfigItem[]) {
    const configItems = this.tag
      ? inputItems.filter((item) => item.tags?.includes(this.tag ?? ''))
      : inputItems;

    this.validateConfigItems(configItems);

    const handler = this.on('loaded', (loadedItems) => {
      this.configItems = loadedItems.map(({ requestedItem }) => requestedItem);
      this.off('loaded', handler);
    });

    await this.loadConfigItems(
      configItems,
      {
        code: In(configItems.map((item) => item.code)),
      },
      false,
    );

    await this.trigger?.start();
  }

  private validateConfigItems(configItems: ConfigItem[]) {
    if (configItems.filter((item) => item.code).length !== configItems.length) {
      throw new ValidationError(
        'The code field must be set for all config items',
      );
    }
  }

  private async loadConfigItems(
    configItems: ConfigItem[],
    condition: FindOptionsWhere<ConfigModel>,
    isTriggerCall: boolean,
  ) {
    const itemsMap = new Map<string, ConfigItem>();

    for (const item of configItems) {
      if (item.code) {
        itemsMap.set(item.code, item);
      }
    }

    const loadedItems = new Map<string, { value: any }>();
    await this.loadItemsFromDb(loadedItems, {
      ...condition,
      serviceVersion: IsNull(),
    });

    if (this.serviceVersion) {
      await this.loadItemsFromDb(loadedItems, {
        ...condition,
        serviceVersion: this.serviceVersion,
      });
    }

    if (this.createMissingItems && !isTriggerCall) {
      await this.createItemsIfNeeded(
        itemsMap,
        loadedItems,
        this.serviceVersion,
      );
    }

    const providedItems = Array.from(loadedItems.entries())
      .filter(([code]) => itemsMap.has(code))
      .map(([code, { value }]) => {
        const requestedItem = itemsMap.get(code)!;
        return {
          requestedItem,
          providedItem: {
            ...requestedItem,
            value,
          },
        };
      });

    return this.emit('loaded', providedItems);
  }

  private async loadItemsFromDb(
    loadedItemsMap: Map<string, { value: any }>,
    condition: FindOptionsWhere<ConfigModel>,
  ) {
    const items = await this.config.findBy({
      service: this.serviceName,
      ...condition,
    });

    for (const item of items) {
      loadedItemsMap.set(item.code, {
        value: item.value.data,
      });

      if (this.maxDate < item.changesCheck) {
        this.maxDate = item.changesCheck;
      }
    }
  }

  private async createItemsIfNeeded(
    requestedItems: Map<string, ConfigItem>,
    loadedItemsMap: Map<string, { value: any }>,
    serviceVersion?: string,
  ) {
    const maxDate = new Date();

    return Promise.all(
      Array.from(requestedItems.values())
        .filter((item) => !loadedItemsMap.has(item.code!))
        .map(async (item) => {
          await this.config.save({
            code: item.code!,
            value: {
              type: item.type,
              data: item.value,
            },
            serviceVersion: serviceVersion ?? null,
            changesCheck: maxDate,
            service: this.serviceName,
            name: item.name,
          });
          this.maxDate = maxDate;
          loadedItemsMap.set(item.code!, item);
        }),
    );
  }
}
