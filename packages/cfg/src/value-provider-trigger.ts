import { EventEmitter } from './event-emitter';

type EventMap = {
  update: () => void | Promise<void>;
};

export abstract class ValueProviderTrigger extends EventEmitter<EventMap> {
  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;
}
