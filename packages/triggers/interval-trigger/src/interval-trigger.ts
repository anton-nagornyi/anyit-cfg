import { ValueProviderTrigger } from '@anyit/cfg';
import { Config } from './config';

export type IntervalTriggerArgs = {
  interval: number;
};

export class IntervalTrigger extends ValueProviderTrigger {
  constructor({ interval = Config.triggerInterval }: IntervalTriggerArgs) {
    super();
    this.interval = Math.trunc(interval * 1000);
  }

  private readonly interval: number;

  private timeout?: ReturnType<typeof setTimeout>;

  start(): Promise<void> {
    const task = () => {
      this.timeout = setTimeout(async () => {
        await this.emit('update');
        task();
      }, this.interval);
    };
    task();
    return Promise.resolve();
  }

  stop(): Promise<void> {
    clearTimeout(this.timeout);
    return Promise.resolve();
  }
}
