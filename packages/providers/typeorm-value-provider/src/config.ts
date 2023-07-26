import { Cfg } from '@anyit/cfg';

export const Config = Cfg.set({
  tableName: {
    default: 'config',
    type: 'string',
  },
  createMissing: {
    default: true,
    type: 'boolean',
  },
  serviceName: {
    default: '',
    type: 'string',
    envName: 'SERVICE_NAME',
  },
  serviceVersion: {
    default: '',
    type: 'string',
  },
});
