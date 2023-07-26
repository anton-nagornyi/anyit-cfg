import { Cfg } from '../src/cfg';
import { ConfigItem } from '../src/shared/types';
import * as process from 'process';
import { ValueProvider } from '../src/value-provider';

describe('Given Config', () => {
  describe('When no environment variables is provided', () => {
    let config: any;

    beforeEach(() => {
      config = Cfg.set({
        test1: {
          settingOne: {
            default: 'string',
            type: 'string',
          },
          settingTwo: {
            default: 2.6,
            type: 'integer',
          },
        },
        test2: {
          settingOne: {
            default: 2.7,
            type: 'float',
          },
          settingTwo: {
            default: true,
            type: 'boolean',
          },
        },
        test3: {
          settingOne: {
            default: {},
            type: 'json',
          },
        },
      });
    });

    it('Then string value has the correct default value', () => {
      expect(config.test1.settingOne).toBe('string');
    });

    it('Then integer value has the correct default value', () => {
      expect(config.test1.settingTwo).toBe(2);
    });

    it('Then float value has the correct default value', () => {
      expect(config.test2.settingOne).toBe(2.7);
    });

    it('Then boolean value has the correct default value', () => {
      expect(config.test2.settingTwo).toBe(true);
    });

    it('Then json value has the correct default value', () => {
      expect(config.test3.settingOne).toEqual({});
    });
  });

  describe('When environment variables are set', () => {
    let config: any;

    beforeEach(() => {
      process.env.CFG_TEST1_SETTING_ONE = 'env string';
      process.env.CFG_TEST1_SETTING_TWO = '3.87';
      process.env.CFG_TEST2_SETTING_ONE = '2.67';
      process.env.CFG_TEST2_SETTING_TWO = 'false';
      process.env.CFG_TEST3_SETTING_ONE =
        '{"stringField": "value", "numberField": 22, "booleanField": true, "objField": {"foo": "bar"}}';

      config = Cfg.set({
        test1: {
          settingOne: {
            default: 'string',
            type: 'string',
          },
          settingTwo: {
            default: 2.6,
            type: 'integer',
          },
        },
        test2: {
          settingOne: {
            default: 2.7,
            type: 'float',
          },
          settingTwo: {
            default: true,
            type: 'boolean',
          },
        },
        test3: {
          settingOne: {
            default: {},
            type: 'json',
          },
        },
      });
    });

    afterEach(() => {
      Object.keys(process.env).forEach((key) => {
        if (key.startsWith('CFG_')) {
          delete process.env[key];
        }
      });
    });

    it('Then string value is correct', () => {
      expect(config.test1.settingOne).toBe('env string');
    });

    it('Then integer value is correct', () => {
      expect(config.test1.settingTwo).toBe(3);
    });

    it('Then float value is correct', () => {
      expect(config.test2.settingOne).toBe(2.67);
    });

    it('Then boolean value is correct', () => {
      expect(config.test2.settingTwo).toBe(false);
    });

    it('Then json value is correct', () => {
      expect(config.test3.settingOne).toEqual({
        stringField: 'value',
        numberField: 22,
        booleanField: true,
        objField: { foo: 'bar' },
      });
    });
  });

  describe('When loading from providers', () => {
    class Provider1 extends ValueProvider {
      get tag(): string {
        return 'provider1';
      }

      load(configItems: ConfigItem[]): Promise<void> | void {
        if (configItems.length === 2) {
          this.emit('loaded', [
            {
              requestedItem: configItems[0],
              providedItem: { ...configItems[0], value: 'oy' },
            },
            { requestedItem: configItems[1], providedItem: null },
          ]);
        } else {
          this.emit('loaded', [
            {
              requestedItem: configItems[0],
              providedItem: { ...configItems[0], value: 'oy' },
            },
          ]);
        }
      }
    }

    class Provider2 extends ValueProvider {
      get tag(): string {
        return 'provider2';
      }

      load(configItems: ConfigItem[]): Promise<void> | void {
        if (configItems.length === 2) {
          this.emit('loaded', [
            { requestedItem: configItems[0], providedItem: null },
            {
              requestedItem: configItems[1],
              providedItem: { ...configItems[1], value: 1000 },
            },
          ]);
        } else {
          this.emit('loaded', [
            {
              requestedItem: configItems[0],
              providedItem: { ...configItems[0], value: 1000 },
            },
          ]);
        }
      }
    }

    describe('And loading from provider1', () => {
      let provider;
      let config: any;
      let onSet: ReturnType<typeof jest.fn>;
      let onChange: ReturnType<typeof jest.fn>;

      beforeEach(() => {
        provider = new Provider1();
        config = Cfg.set({
          test1: {
            settingOne: {
              default: 'old value',
              type: 'string',
            },
            settingTwo: {
              default: 2,
              type: 'integer',
            },
          },
        });

        onSet = jest.fn();
        onChange = jest.fn();

        config.on('set', onSet);
        config.on('changed', onChange);

        config.load(provider);
      });

      it('Then string value is correct', () => {
        expect(config.test1.settingOne).toBe('oy');
      });

      it('Then integer value is correct', () => {
        expect(config.test1.settingTwo).toBe(2);
      });

      it('Then onChange is called correct number of times', () => {
        expect(onChange).toBeCalledTimes(1);
      });

      it('Then onChange is called with the correct args', () => {
        expect(onChange).toBeCalledWith(
          expect.objectContaining({
            code: undefined,
            default: 'old value',
            envName: undefined,
            name: 'test1:settingOne',
            tags: [],
            type: 'string',
            value: 'oy',
          }),
          'old value',
        );
      });

      it('Then onSet is called correct number of times', () => {
        expect(onSet).toBeCalledTimes(1);
      });

      it('Then onSet is called with the correct args', () => {
        expect(onSet).toBeCalledWith(
          expect.objectContaining({
            code: undefined,
            default: 'old value',
            envName: undefined,
            name: 'test1:settingOne',
            tags: [],
            type: 'string',
            value: 'oy',
          }),
        );
      });
    });

    describe('And loading from provider2', () => {
      let provider;
      let config: any;
      let onSet: ReturnType<typeof jest.fn>;
      let onChange: ReturnType<typeof jest.fn>;

      beforeEach(() => {
        provider = new Provider2();
        config = Cfg.set({
          test1: {
            settingOne: {
              default: 'old value',
              type: 'string',
            },
            settingTwo: {
              default: 2,
              type: 'integer',
            },
          },
        });

        onSet = jest.fn();
        onChange = jest.fn();

        config.on('set', onSet);
        config.on('changed', onChange);

        config.load(provider);
      });

      it('Then string value is correct', () => {
        expect(config.test1.settingOne).toBe('old value');
      });

      it('Then integer value is correct', () => {
        expect(config.test1.settingTwo).toBe(1000);
      });

      it('Then onChange is called correct number of times', () => {
        expect(onChange).toBeCalledTimes(1);
      });

      it('Then onChange is called with the correct args', () => {
        expect(onChange).toBeCalledWith(
          expect.objectContaining({
            code: undefined,
            default: 2,
            envName: undefined,
            name: 'test1:settingTwo',
            tags: [],
            type: 'integer',
            value: 1000,
          }),
          2,
        );
      });

      it('Then onSet is called correct number of times', () => {
        expect(onSet).toBeCalledTimes(1);
      });

      it('Then onSet is called with the correct args', () => {
        expect(onSet).toBeCalledWith(
          expect.objectContaining({
            code: undefined,
            default: 2,
            envName: undefined,
            name: 'test1:settingTwo',
            tags: [],
            type: 'integer',
            value: 1000,
          }),
        );
      });
    });

    describe('And loading from provider1 and provider2', () => {
      let provider1;
      let provider2;
      let config: any;
      let onSet: ReturnType<typeof jest.fn>;
      let onChange: ReturnType<typeof jest.fn>;

      beforeEach(() => {
        provider1 = new Provider1();
        provider2 = new Provider2();
        config = Cfg.set({
          test1: {
            settingOne: {
              default: 'old value',
              type: 'string',
            },
            settingTwo: {
              default: 2,
              type: 'integer',
            },
          },
        });

        onSet = jest.fn();
        onChange = jest.fn();

        config.on('set', onSet);
        config.on('changed', onChange);

        config.load(provider1, provider2);
      });

      it('Then string value is correct', () => {
        expect(config.test1.settingOne).toBe('oy');
      });

      it('Then integer value is correct', () => {
        expect(config.test1.settingTwo).toBe(1000);
      });

      it('Then onChange is called correct number of times', () => {
        expect(onChange).toBeCalledTimes(2);
      });

      it('Then onChange is called with the correct args', () => {
        expect(onChange).toHaveBeenCalledWith(
          expect.objectContaining({
            code: undefined,
            default: 'old value',
            envName: undefined,
            name: 'test1:settingOne',
            tags: [],
            type: 'string',
            value: 'oy',
          }),
          'old value',
        );
        expect(onChange).toHaveBeenCalledWith(
          expect.objectContaining({
            code: undefined,
            default: 2,
            envName: undefined,
            name: 'test1:settingTwo',
            tags: [],
            type: 'integer',
            value: 1000,
          }),
          2,
        );
      });

      it('Then onSet is called correct number of times', () => {
        expect(onSet).toBeCalledTimes(2);
      });

      it('Then onSet is called with the correct args', () => {
        expect(onSet).toHaveBeenCalledWith(
          expect.objectContaining({
            code: undefined,
            default: 'old value',
            envName: undefined,
            name: 'test1:settingOne',
            tags: [],
            type: 'string',
            value: 'oy',
          }),
        );

        expect(onSet).toHaveBeenCalledWith(
          expect.objectContaining({
            code: undefined,
            default: 2,
            envName: undefined,
            name: 'test1:settingTwo',
            tags: [],
            type: 'integer',
            value: 1000,
          }),
        );
      });
    });

    describe('And loading from provider1 and provider2 using tags', () => {
      let provider1;
      let provider2;
      let config: any;
      let onSet: ReturnType<typeof jest.fn>;
      let onChange: ReturnType<typeof jest.fn>;

      beforeEach(() => {
        provider1 = new Provider1();
        provider2 = new Provider2();
        config = Cfg.set({
          test1: {
            settingOne: {
              default: 'old value',
              type: 'string',
              tags: ['provider1'],
            },
            settingTwo: {
              default: 2,
              type: 'integer',
              tags: ['provider2'],
            },
          },
        });

        onSet = jest.fn();
        onChange = jest.fn();

        config.on('set', onSet);
        config.on('changed', onChange);

        config.load(provider1, provider2);
      });

      it('Then string value is correct', () => {
        expect(config.test1.settingOne).toBe('oy');
      });

      it('Then integer value is correct', () => {
        expect(config.test1.settingTwo).toBe(1000);
      });

      it('Then onChange is called correct number of times', () => {
        expect(onChange).toBeCalledTimes(2);
      });

      it('Then onChange is called with the correct args', () => {
        expect(onChange).toHaveBeenCalledWith(
          expect.objectContaining({
            code: undefined,
            default: 'old value',
            envName: undefined,
            name: 'test1:settingOne',
            tags: ['provider1'],
            type: 'string',
            value: 'oy',
          }),
          'old value',
        );
        expect(onChange).toHaveBeenCalledWith(
          expect.objectContaining({
            code: undefined,
            default: 2,
            envName: undefined,
            name: 'test1:settingTwo',
            tags: ['provider2'],
            type: 'integer',
            value: 1000,
          }),
          2,
        );
      });

      it('Then onSet is called correct number of times', () => {
        expect(onSet).toBeCalledTimes(2);
      });

      it('Then onSet is called with the correct args', () => {
        expect(onSet).toHaveBeenCalledWith(
          expect.objectContaining({
            code: undefined,
            default: 'old value',
            envName: undefined,
            name: 'test1:settingOne',
            tags: ['provider1'],
            type: 'string',
            value: 'oy',
          }),
        );

        expect(onSet).toHaveBeenCalledWith(
          expect.objectContaining({
            code: undefined,
            default: 2,
            envName: undefined,
            name: 'test1:settingTwo',
            tags: ['provider2'],
            type: 'integer',
            value: 1000,
          }),
        );
      });
    });
  });

  describe('When wring value to the config object', () => {
    let config: any;
    let onSet: ReturnType<typeof jest.fn>;
    let onChange: ReturnType<typeof jest.fn>;

    beforeEach(() => {
      config = Cfg.set({
        test1: {
          settingOne: {
            default: 'string',
            type: 'string',
          },
          settingTwo: {
            default: 5,
            type: 'integer',
          },
        },
        test2: {
          settingOne: {
            default: 2.7,
            type: 'float',
          },
          settingTwo: {
            default: true,
            type: 'boolean',
          },
        },
        test3: {
          settingOne: {
            default: { a: 22 },
            type: 'json',
          },
        },
      });

      onSet = jest.fn();
      onChange = jest.fn();

      config.on('set', onSet);
      config.on('changed', onChange);
    });

    describe('And setting new string value', () => {
      beforeEach(() => {
        config.test1.settingOne = 'oy';
      });

      it('Then onSet is called the correct number of times', () => {
        expect(onSet).toBeCalledTimes(1);
      });

      it('Then onSet is called with the correct args', () => {
        expect(onSet).toBeCalledWith({
          code: undefined,
          default: 'string',
          envName: undefined,
          name: 'test1:settingOne',
          tags: [],
          type: 'string',
          value: 'oy',
        });
      });

      it('Then onChange is called the correct number of times', () => {
        expect(onChange).toBeCalledTimes(1);
      });

      it('Then onChange is called with the correct args', () => {
        expect(onChange).toBeCalledWith(
          {
            code: undefined,
            default: 'string',
            envName: undefined,
            name: 'test1:settingOne',
            tags: [],
            type: 'string',
            value: 'oy',
          },
          'string',
        );
      });
    });

    describe('And setting string with the old value', () => {
      beforeEach(() => {
        config.test1.settingOne = 'string';
      });

      it('Then onSet is called the correct number of times', () => {
        expect(onSet).toBeCalledTimes(1);
      });

      it('Then onSet is called with the correct args', () => {
        expect(onSet).toBeCalledWith({
          code: undefined,
          default: 'string',
          envName: undefined,
          name: 'test1:settingOne',
          tags: [],
          type: 'string',
          value: 'string',
        });
      });

      it('Then onChange is not called', () => {
        expect(onChange).toBeCalledTimes(0);
      });
    });

    describe('And setting new integer value', () => {
      beforeEach(() => {
        config.test1.settingTwo = 1000;
      });

      it('Then onSet is called the correct number of times', () => {
        expect(onSet).toBeCalledTimes(1);
      });

      it('Then onSet is called with the correct args', () => {
        expect(onSet).toBeCalledWith({
          code: undefined,
          default: 5,
          envName: undefined,
          name: 'test1:settingTwo',
          tags: [],
          type: 'integer',
          value: 1000,
        });
      });

      it('Then onChange is called the correct number of times', () => {
        expect(onChange).toBeCalledTimes(1);
      });

      it('Then onChange is called with the correct args', () => {
        expect(onChange).toBeCalledWith(
          {
            code: undefined,
            default: 5,
            envName: undefined,
            name: 'test1:settingTwo',
            tags: [],
            type: 'integer',
            value: 1000,
          },
          5,
        );
      });
    });

    describe('And setting integer with the old value', () => {
      beforeEach(() => {
        config.test1.settingTwo = 5;
      });

      it('Then onSet is called the correct number of times', () => {
        expect(onSet).toBeCalledTimes(1);
      });

      it('Then onSet is called with the correct args', () => {
        expect(onSet).toBeCalledWith({
          code: undefined,
          default: 5,
          envName: undefined,
          name: 'test1:settingTwo',
          tags: [],
          type: 'integer',
          value: 5,
        });
      });

      it('Then onChange is not called', () => {
        expect(onChange).toBeCalledTimes(0);
      });
    });

    describe('And setting new float value', () => {
      beforeEach(() => {
        config.test2.settingOne = 5.6;
      });

      it('Then onSet is called the correct number of times', () => {
        expect(onSet).toBeCalledTimes(1);
      });

      it('Then onSet is called with the correct args', () => {
        expect(onSet).toBeCalledWith({
          code: undefined,
          default: 2.7,
          envName: undefined,
          name: 'test2:settingOne',
          tags: [],
          type: 'float',
          value: 5.6,
        });
      });

      it('Then onChange is called the correct number of times', () => {
        expect(onChange).toBeCalledTimes(1);
      });

      it('Then onChange is called with the correct args', () => {
        expect(onChange).toBeCalledWith(
          {
            code: undefined,
            default: 2.7,
            envName: undefined,
            name: 'test2:settingOne',
            tags: [],
            type: 'float',
            value: 5.6,
          },
          2.7,
        );
      });
    });

    describe('And setting float with the old value', () => {
      beforeEach(() => {
        config.test2.settingOne = 2.7;
      });

      it('Then onSet is called the correct number of times', () => {
        expect(onSet).toBeCalledTimes(1);
      });

      it('Then onSet is called with the correct args', () => {
        expect(onSet).toBeCalledWith({
          code: undefined,
          default: 2.7,
          envName: undefined,
          name: 'test2:settingOne',
          tags: [],
          type: 'float',
          value: 2.7,
        });
      });

      it('Then onChange is not called', () => {
        expect(onChange).toBeCalledTimes(0);
      });
    });

    describe('And setting new boolean value', () => {
      beforeEach(() => {
        config.test2.settingTwo = false;
      });

      it('Then onSet is called the correct number of times', () => {
        expect(onSet).toBeCalledTimes(1);
      });

      it('Then onSet is called with the correct args', () => {
        expect(onSet).toBeCalledWith({
          code: undefined,
          default: true,
          envName: undefined,
          name: 'test2:settingTwo',
          tags: [],
          type: 'boolean',
          value: false,
        });
      });

      it('Then onChange is called the correct number of times', () => {
        expect(onChange).toBeCalledTimes(1);
      });

      it('Then onChange is called with the correct args', () => {
        expect(onChange).toBeCalledWith(
          {
            code: undefined,
            default: true,
            envName: undefined,
            name: 'test2:settingTwo',
            tags: [],
            type: 'boolean',
            value: false,
          },
          true,
        );
      });
    });

    describe('And setting boolean with the old value', () => {
      beforeEach(() => {
        config.test2.settingTwo = true;
      });

      it('Then onSet is called the correct number of times', () => {
        expect(onSet).toBeCalledTimes(1);
      });

      it('Then onSet is called with the correct args', () => {
        expect(onSet).toBeCalledWith({
          code: undefined,
          default: true,
          envName: undefined,
          name: 'test2:settingTwo',
          tags: [],
          type: 'boolean',
          value: true,
        });
      });

      it('Then onChange is not called', () => {
        expect(onChange).toBeCalledTimes(0);
      });
    });

    describe('And setting new json value', () => {
      beforeEach(() => {
        config.test3.settingOne = { b: 33 };
      });

      it('Then onSet is called the correct number of times', () => {
        expect(onSet).toBeCalledTimes(1);
      });

      it('Then onSet is called with the correct args', () => {
        expect(onSet).toBeCalledWith({
          code: undefined,
          default: { a: 22 },
          envName: undefined,
          name: 'test3:settingOne',
          tags: [],
          type: 'json',
          value: { b: 33 },
        });
      });

      it('Then onChange is called the correct number of times', () => {
        expect(onChange).toBeCalledTimes(1);
      });

      it('Then onChange is called with the correct args', () => {
        expect(onChange).toBeCalledWith(
          {
            code: undefined,
            default: { a: 22 },
            envName: undefined,
            name: 'test3:settingOne',
            tags: [],
            type: 'json',
            value: { b: 33 },
          },
          { a: 22 },
        );
      });
    });

    describe('And setting json with the old value', () => {
      beforeEach(() => {
        config.test3.settingOne = { a: 22 };
      });

      it('Then onSet is called the correct number of times', () => {
        expect(onSet).toBeCalledTimes(1);
      });

      it('Then onSet is called with the correct args', () => {
        expect(onSet).toBeCalledWith({
          code: undefined,
          default: { a: 22 },
          envName: undefined,
          name: 'test3:settingOne',
          tags: [],
          type: 'json',
          value: { a: 22 },
        });
      });

      it('Then onChange is not called', () => {
        expect(onChange).toBeCalledTimes(0);
      });
    });
  });
});
