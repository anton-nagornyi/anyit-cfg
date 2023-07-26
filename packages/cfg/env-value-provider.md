# Environment variables provider

Let's consider the following configuration example:

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
`EnvValueProvider` will look for environment variables:
* CFG_SERVER_HOST
* CFG_SERVER_PORT

In case you want to change what variables it is looking for, you can:

```typescript
export const Config = Cfg.set({
  server: {
    host: {
      default: 'localhost',
      type: 'string',
      envName: 'SERVER'
    },
    port: {
      default: 3000,
      type: 'integer',
      envName: 'PORT'
    },
  }
});
```

Then:

```typescript
console.log(Config.server.host); // Returns value that is equal to process.env.SERVER
console.log(Config.server.port); // Returns value that is equal to process.env.PORT
```