# Configuration management library

Cfg provides a convenient way to define, load, and access configuration settings in your application.

## Features

- Define configuration settings using TypeScript definitions.
- Load configuration values from different value providers (e.g., environment variables).
- Access configuration settings through a typed API.
- Emit events when configuration settings are changed.

## Installation

To install Cfg, use npm or yarn:

```bash
npm install --save @anyit/cfg
```

```bash
yarn add @anyit/cfg
```

## Usage

1. Define your configuration:
```typescript
export const Config = Cfg.set({
  server: {
    host: {
      default: 'localhost',
      type: 'string',
    },
    port: {
      default: 3000,
      type: 'integer',
    },
  },
  database: {
    url: {
      default: 'localhost',
      type: 'string',
    },
    port: {
      default: 5432,
      type: 'integer',
    },
    username: {
      default: 'user',
      type: 'string'
    },
    password: {
      default: 'passwd',
      type: 'string'
    }
  }
});
```

### ConfigDefinition and ConfigItem differences
When you define your config, as in example above, you are using `ConfigDefinition`. Under the hood, for each `ConfigDefinition`
the corresponding `ConfigItem`. It has the same fields as the `ConfigDefinition` but it also has a value. You don't need
to care about this unless you are writing your own value provider.

### ConfigDefinition:
* `code`: Optional string value that uniquely identifies config definition and item later. UUID and ULID are the best 
choices for this. This code can be used in some providers where uniqueness matters.
* `default`: Value that will be set to the configuration item when it is not provided by any provider.
* `type`: Value type is used to sanitize value and properly convert it to the required type.
* `envName`: Optional alias for environment variable where to look for the value. 
* `tags`: Optional array of tags for additional config item identification.


2. Access your configuration settings:

```typescript
console.log(Config.server.host);
console.log(Config.server.port);
```

3. If required, listen to configuration changes:
```typescript
Config.on('changed', (configItem, prevValue) => {
  console.log(`Configuration setting ${configItem.name} changed from ${prevValue} to ${configItem.value}`);
});

Config.on('set', (configItem) => {
  console.log(`Configuration item value was set to ${configItem.value}`);
});
```

`set` event will be emitted everytime `configItem.value` is written.
`changed` event will be emitted only if the `configItem.value` was really changed.
