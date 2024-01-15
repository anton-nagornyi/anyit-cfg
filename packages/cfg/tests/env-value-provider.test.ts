import { EnvValueProvider } from '../src/env-value-provider';
import '@anyit/be-dev';

describe('Given EnvValueProvider', () => {
  let provider: EnvValueProvider;
  let onLoaded: ReturnType<typeof jest.fn>;

  beforeEach(() => {
    provider = new EnvValueProvider();
    onLoaded = jest.fn();

    provider.on('loaded', onLoaded);
  });

  describe('When load', () => {
    beforeEach(() => {
      process.env.CFG_TEST1_SETTING_ONE = '1000';
      process.env.CFG_TEST = '2000';

      provider.load([
        {
          default: 1,
          type: 'integer',
          name: 'test1:settingOne',
          value: 3,
        },
        {
          default: 2,
          type: 'integer',
          name: 'test1:settingTwo',
          value: 5,
        },
        {
          default: 3,
          type: 'integer',
          name: 'test1:settingThree',
          value: 7,
          envName: 'CFG_TEST',
        },
      ]);
    });

    afterEach(() => {
      Object.keys(process.env).forEach((key) => {
        if (key.startsWith('CFG_')) {
          delete process.env[key];
        }
      });
    });

    it('Then onLoaded is called the correct number of times', () => {
      expect(onLoaded).toBeCalledTimes(1);
    });

    it('Then onLoaded is called with the correct args', () => {
      expect(onLoaded).toBeCalledWith([
        {
          requestedItem: {
            default: 1,
            type: 'integer',
            name: 'test1:settingOne',
            value: 3,
          },
          providedItem: {
            default: 1,
            type: 'integer',
            name: 'test1:settingOne',
            value: '1000',
            envName: 'CFG_TEST1_SETTING_ONE',
          },
        },
        {
          requestedItem: {
            default: 2,
            type: 'integer',
            name: 'test1:settingTwo',
            value: 5,
          },
          providedItem: null,
        },
        {
          requestedItem: {
            default: 3,
            type: 'integer',
            name: 'test1:settingThree',
            value: 7,
            envName: 'CFG_TEST',
          },
          providedItem: {
            default: 3,
            type: 'integer',
            name: 'test1:settingThree',
            value: '2000',
            envName: 'CFG_TEST',
          },
        },
      ]);
    });
  });
});
