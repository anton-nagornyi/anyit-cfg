# Typeorm values provider

The `TypeormValueProvider` is a custom value provider for the [@anyit/cfg](../../cfg/README.md) library that 
fetches configuration items from a TypeORM Repository and provides them to the `Cfg` class.

# Constructor

```typescript
new TypeormValueProvider(args: TypeormValueProviderArgs)
```

Creates a new instance of the `TypeormValueProvider`.

* `args.dataSource` (required): The TypeORM `DataSource` from which to fetch the configuration items.
* `args.trigger` (optional): The `ValueProviderTrigger` that will trigger updates for this provider 
when configuration items change. Default is `undefined`.
* `args.tag` (optional): The tag to associate with the configuration items fetched by this provider. Default is `undefined`.
* `args.serviceName` (optional): The name of the service for which to fetch the configuration items. 
Default is the value of `process.env.SERVICE_NAME`.
* `args.serviceVersion` (optional): The version of the service for which to fetch the configuration items. 
Default is the value of `process.env.CFG_SERVICE_VERSION`.
* `args.createMissingItems` (optional): When it is `true`, the provider will create records in a database for every config
item that is not yet stored. Default is `true`.

# Methods
```typescript
load(configItems: ConfigItem[]): Promise<void>
```

Loads the configuration items from the `Repository` based on the provided configItems array. The loaded items are then 
emitted through the 'loaded' event.

* `configItems`: An array of ConfigItem objects representing the configuration items to load.

#### Loading Process:
1. **Unversioned Items**: The method first looks for configuration items that have the serviceVersion set to null
(unversioned items).
2. **Versioned Items**: Next, the method looks for configuration items that have the serviceVersion set to a specific 
value (versioned items). If the TypeormValueProvider instance was initialized with a specific serviceVersion, it will 
fetch these versioned items from the database based on the same condition.
3. **Merging**: The resulting configuration items are obtained by merging the `unversioned` and `versioned` items. 
Versioned items take priority over unversioned items, meaning that if a configuration item exists in both sources, 
the value from the versioned item will be used.

# Events
Event: 'loaded'
Emitted when the configuration items have been loaded from the `Repository`.

# Usage

Before using the `TypeormValueProvider`, you need to ensure that the `ConfigModel` is registered with TypeORM. 
This is typically done by adding the ConfigModel to the entities array in your TypeORM configuration.

```typescript
// Assuming you have a TypeORM configuration file like this:
import { ConfigModel } from './models/config-model';

export default {
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'dbuser',
  password: 'dbpassword',
  database: 'dbname',
  entities: [ConfigModel, /* other entities */],
  synchronize: true,
};
```

Assuming you have already defined configuration in the `config.ts`:

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
});
```

Then you can use the `TypeormValueProvider`:

```typescript
import { TypeormValueProvider } from '@anyit/cfg-typeorm-value-provider';
import { DataSource } from 'typeorm';
import { Config } from './config';

// Create a TypeORM DataSource and Repository
const dataSource = new DataSource(...);

// Create an instance of TypeormValueProvider
const valueProvider = new TypeormValueProvider({
  dataSource,
  tag: 'my-tag',
  serviceName: 'my-service',
  serviceVersion: '1.0.0',
});

// Load the configuration items
(async () => {
  await Config.load(valueProvider)
})()
```

## Using triggers

You can configure when to reload configuration from TypeORM with the help of triggers. To do so, just create an instance
of a trigger and pass it to the `TypeormValueProvider` constructor:

```typescript
import { TypeormValueProvider } from '@anyit/cfg-typeorm-value-provider';
import { IntervalTrigger } from '@anyit/cfg-interval-trigger';
import { DataSource } from 'typeorm';
import { Config } from './config';

// Create a TypeORM DataSource and Repository
const dataSource = new DataSource(...);

const triggerIntervalInSeconds = 10; // Set the desired interval in seconds
const intervalTrigger = new IntervalTrigger({ interval: triggerIntervalInSeconds });

// Create an instance of TypeormValueProvider
const valueProvider = new TypeormValueProvider({
  dataSource,
  tag: 'my-tag',
  trigger: intervalTrigger,
  serviceName: 'my-service',
  serviceVersion: '1.0.0',
});
```