# Interval trigger

The `IntervalTrigger` class is a custom trigger implementation that extends the `ValueProviderTrigger` class from
the [@anyit/cfg](../../../packages/cfg/README.md) library. It provides a way to trigger updates regularly,
allowing you to reload configuration items in your application periodically.

# Constructor

```typescript
constructor(args: IntervalTriggerArgs)
```

* args.interval (optional): The time interval in seconds at which the trigger should emit the `update` event.
  The default value is fetched from the `process.env.CFG_TRIGGER_INTERVAL` property.

# Methods

```typescript
start(): Promise<void>
```
Starts the interval trigger. The trigger will emit the `update` event at the specified interval.

```typescript
stop(): Promise<void>
```
Stops the interval trigger. The trigger will no longer emit the `update` event.

# Usage

To use the `IntervalTrigger`, first, you need to create an instance of the trigger by providing the desired interval:

```typescript
import { IntervalTrigger } from '@anyit/cfg-interval-trigger';

const triggerIntervalInSeconds = 10; // Set the desired interval in seconds
const intervalTrigger = new IntervalTrigger({ interval: triggerIntervalInSeconds });
```

Then, you can use the `intervalTrigger` instance as the trigger for the value provider, which can be configured to use
triggers. Please, see [the example here](../../../packages/providers/typeorm-value-provider/README.md#using-triggers).
