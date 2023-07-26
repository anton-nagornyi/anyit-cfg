# Configuration management

This gives a set of tools to manage your configuration.

## Config

`Cfg` allows to define your configuration by providing [`ConfigDefinition`](packages/cfg/README.md#configdefinition-) 
records in a structure of an object. Please see [details here](packages/cfg/README.md).

## Providers

### Loading configuration from providers

When [`Cfg.set`](packages/cfg/README.md#usage) is called, environment variables are immediately checked if there are 
values for provided config definitions. So, right from the start config items may contain values from environment
variables. There is [`EnvValueProvider`](packages/cfg/env-value-provider.md) responsible for this.

If having only environment variables is not enough for the system configuration, you can use other providers to get
config item values. For example, `TypeormValueProvider` can load values via TypeOrm using any database it supports.

To load from one provider or multiple providers do:

```typescript
Config.load(provider1, provider2)
```

[ConfigItems](packages/cfg/README.md#configdefinition-and-configitem-differences) values will be loaded in the next
order:
1. Try to load all [ConfigItems](packages/cfg/README.md#configdefinition-and-configitem-differences) using `provider1`.
2. If [ConfigItems](packages/cfg/README.md#configdefinition-and-configitem-differences) are not loaded
with `provider1` load them with `provider2`.
3. If [ConfigItems](packages/cfg/README.md#configdefinition-and-configitem-differences) are not loaded
with `provider1` and `provider2` they will contain values obtained from the 
[`EnvValueProvider`](packages/cfg/env-value-provider.md) or will have default values, if there are no corresponding
environment variable.

#### Making [ConfigItems](packages/cfg/README.md#configdefinition-and-configitem-differences) to be loaded by specific
provider.

Let's consider the following configuration example:

```typescript
export const Config = Cfg.set({
  server: {
    host: {
      default: 'localhost',
      type: 'string',
      tags: ['shared']
    },
    port: {
      default: 3000,
      type: 'integer',
      tags: ['internal']
    },
  },
  database: {
    url: {
      default: 'localhost',
      type: 'string',
    },
  }
});

Config.load(provider1, provider2);
```
And `provider1` is tagged as `shared`. And `provider2` is tagged as `internal`.

In this scenario, `server:host` value will be loaded with `provider1` and `server:port` value will be loaded
with `provider2`. The value for the `database:url` will loaded with `provider1` and if it does not contain value for it
then that value will be loaded from `provider2`.

#### Having multiple tags for the [`ConfigDefinition`](packages/cfg/README.md#configdefinition-)

Let's consider the following configuration example:

```typescript
export const Config = Cfg.set({
  server: {
    host: {
      default: 'localhost',
      type: 'string',
      tags: ['shared', 'internal']
    },
    port: {
      default: 3000,
      type: 'integer',
      tags: ['internal']
    },
  },
});

Config.load(provider1, provider2);
```
And `provider1` is tagged as `shared`. And `provider2` is tagged as `internal`.

In this scenario, `server:host` value will be loaded with `provider1` and if it does not contain value for it
then that value will be loaded from `provider2`. The value for `server:port` value will be loaded
with `provider2`.

### Writing custom value providers

To create custom value provider:
1. Inherit `ValueProvider` class.
2. In the `load` method call `this.emit('loaded', ...)` when loading of configuration values is done.

### Provider triggers

If you want your provider reload configuration when some condition met, write custom trigger for that purpose. You can
also use already existing triggers like [IntervalTrigger](packages/triggers/interval-trigger/README.md)

To write a custom trigger just inherit from the `ValueProviderTrigger` class. 
Please, [see the example](packages/providers/typeorm-value-provider/README.md#using-triggers) of how triggers can be used with 
providers.  
