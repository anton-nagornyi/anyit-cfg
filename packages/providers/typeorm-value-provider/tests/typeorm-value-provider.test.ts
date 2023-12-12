import { newDb } from 'pg-mem';
import { DataSource, EntityManager, Repository } from 'typeorm';

import { ConfigModel } from '../src/models/config-model';
import { TypeormValueProvider } from '../src/typeorm-value-provider';
import { ValidationError } from '../src/errors/validation-error';
import { ValueProviderTrigger } from '@anyit/cfg';

describe('TypeormValueProvider', () => {
  let disconnect: Function;
  let dataSource: DataSource;
  let entityManager: EntityManager;
  let configRepository: Repository<ConfigModel>;
  const now = new Date();

  beforeAll(async () => {
    const db = newDb();
    db.public.registerFunction({
      implementation: () => 'test',
      name: 'current_database',
    });

    db.public.registerFunction({
      implementation: () => 'test version',
      name: 'version',
    });

    dataSource = await db.adapters.createTypeormDataSource({
      type: 'postgres',
      entities: [ConfigModel],
    });

    await dataSource.initialize();
    await dataSource.synchronize();

    disconnect = () => dataSource.destroy();

    entityManager = dataSource.manager;
    configRepository = entityManager.getRepository(ConfigModel);
  });

  afterEach(async () => {
    await configRepository.clear();
  });

  afterAll(async () => {
    await disconnect();
  });

  describe('When no trigger is set', function () {
    let provider: TypeormValueProvider;

    beforeEach(() => {
      provider = new TypeormValueProvider({
        dataSource,
        serviceName: 'test-service',
        serviceVersion: '1.0.0',
        createMissingItems: true,
      });
    });

    describe('And loading config items without code', () => {
      it('Then ValidationError is thrown', async () => {
        await expect(
          provider.load([
            {
              type: 'string',
              value: 'ok',
              name: 'item1',
              default: 'ok',
            },
            {
              code: '01H63PAK0Z8B54G4WP3KQ27ZHZ',
              type: 'string',
              value: 'ok',
              name: 'item2',
              default: 'ok',
            },
          ]),
        ).rejects.toThrow(ValidationError);
      });
    });

    describe('And loading config items with code', () => {
      let items: ConfigModel[];
      let onLoaded: ReturnType<typeof jest.fn>;

      beforeEach(async () => {
        const mock = jest.spyOn(global, 'Date').mockImplementation(() => now);
        onLoaded = jest.fn();
        provider.on('loaded', onLoaded);
        await provider.load([
          {
            code: '01H68DFKSC8KB4NJ319ST1R9B3',
            type: 'string',
            value: 'ok',
            name: 'item1',
            default: 'ok',
          },
          {
            code: '01H63PAK0Z8B54G4WP3KQ27ZHZ',
            type: 'string',
            value: 'ok',
            name: 'item2',
            default: 'ok',
          },
        ]);

        mock.mockRestore();
        items = await configRepository.find();
      });

      it('Then config items are created in db', () => {
        expect(items).toEqual([
          {
            changesCheck: now,
            code: '01H68DFKSC8KB4NJ319ST1R9B3',
            id: 1,
            name: 'item1',
            service: 'test-service',
            value: {
              data: 'ok',
              type: 'string',
            },
            serviceVersion: '1.0.0',
            meta: null,
          },
          {
            changesCheck: now,
            code: '01H63PAK0Z8B54G4WP3KQ27ZHZ',
            id: 2,
            name: 'item2',
            service: 'test-service',
            serviceVersion: '1.0.0',
            value: {
              data: 'ok',
              type: 'string',
            },
            meta: null,
          },
        ]);
      });

      it('Then onLoaded is called with correct arguments', () => {
        expect(onLoaded).toBeCalledWith([
          {
            providedItem: {
              code: '01H68DFKSC8KB4NJ319ST1R9B3',
              default: 'ok',
              name: 'item1',
              type: 'string',
              value: 'ok',
            },
            requestedItem: {
              code: '01H68DFKSC8KB4NJ319ST1R9B3',
              default: 'ok',
              name: 'item1',
              type: 'string',
              value: 'ok',
            },
          },
          {
            providedItem: {
              code: '01H63PAK0Z8B54G4WP3KQ27ZHZ',
              default: 'ok',
              name: 'item2',
              type: 'string',
              value: 'ok',
            },
            requestedItem: {
              code: '01H63PAK0Z8B54G4WP3KQ27ZHZ',
              default: 'ok',
              name: 'item2',
              type: 'string',
              value: 'ok',
            },
          },
        ]);
      });
    });
  });

  describe('When createMissingItems is not set', () => {
    let provider: TypeormValueProvider;

    beforeEach(() => {
      provider = new TypeormValueProvider({
        dataSource,
        serviceName: 'test-service',
        serviceVersion: '1.0.0',
        createMissingItems: false,
      });
    });

    describe('And loading config items with code', () => {
      let items: ConfigModel[];
      let onLoaded: ReturnType<typeof jest.fn>;

      beforeEach(async () => {
        onLoaded = jest.fn();
        provider.on('loaded', onLoaded);

        await provider.load([
          {
            code: '01H68DFKSC8KB4NJ319ST1R9B3',
            type: 'string',
            value: 'ok',
            name: 'item1',
            default: 'ok',
          },
          {
            code: '01H63PAK0Z8B54G4WP3KQ27ZHZ',
            type: 'string',
            value: 'ok',
            name: 'item2',
            default: 'ok',
          },
        ]);

        items = await configRepository.find();
      });

      it('Then no config items is created in db', () => {
        expect(items).toHaveLength(0);
      });

      it('Then onLoaded is called with the correct arguments', () => {
        expect(onLoaded).toBeCalledWith([]);
      });
    });
  });

  describe('When trigger is set', () => {
    let provider: TypeormValueProvider;
    class Trigger extends ValueProviderTrigger {
      async start() {
        await new Promise((resolve) => setTimeout(resolve, 2));
        await this.emit('update');
      }

      stop(): Promise<void> {
        return Promise.resolve();
      }
    }
    const trigger = new Trigger();

    beforeEach(async () => {
      provider = new TypeormValueProvider({
        dataSource,
        serviceName: 'test-service',
        createMissingItems: true,
        trigger,
      });

      await provider.load([
        {
          code: '01H68DFKSC8KB4NJ319ST1R9B3',
          type: 'string',
          value: 'ok',
          name: 'item1',
          default: 'ok',
        },
        {
          code: '01H63PAK0Z8B54G4WP3KQ27ZHZ',
          type: 'string',
          value: 'ok',
          name: 'item2',
          default: 'ok',
        },
      ]);
    });

    describe('Trigger emits update', () => {
      let onLoaded: ReturnType<typeof jest.fn>;

      beforeEach(async () => {
        await entityManager.update(
          ConfigModel,
          { code: '01H63PAK0Z8B54G4WP3KQ27ZHZ' },
          {
            changesCheck: new Date(
              (provider as any).maxDate.getTime() + 100000,
            ),
          },
        );
        onLoaded = jest.fn();

        provider.on('loaded', onLoaded);
        await trigger.start();
      });

      it('Then onLoaded is called with correct arguments', () => {
        expect(onLoaded).toBeCalledWith([
          {
            providedItem: {
              code: '01H63PAK0Z8B54G4WP3KQ27ZHZ',
              default: 'ok',
              name: 'item2',
              type: 'string',
              value: 'ok',
            },
            requestedItem: {
              code: '01H63PAK0Z8B54G4WP3KQ27ZHZ',
              default: 'ok',
              name: 'item2',
              type: 'string',
              value: 'ok',
            },
          },
        ]);
      });
    });
  });
});
