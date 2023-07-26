import { Cfg } from '@anyit/cfg';

export const Config = Cfg.set({
  triggerInterval: {
    default: 10,
    type: 'float',
  },
});
