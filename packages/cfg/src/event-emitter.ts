type EventMap = { [key: string | symbol]: (...args: any[]) => void };
type Listener = (...args: any[]) => any;

export class EventEmitter<Events extends EventMap> {
  private listeners = new Map<string | symbol | number, Listener[]>();

  on<K extends keyof Events>(event: K, listener: Events[K]): Listener {
    const listeners = this.listeners.get(event) ?? [];
    listeners.push(listener);
    this.listeners.set(event, listeners);
    return listener;
  }

  off<K extends keyof Events>(event: K, listener: Events[K]): void {
    const listeners = this.listeners.get(event) ?? [];
    listeners.push(listener);
    this.listeners.set(
      event,
      listeners.filter((existingListener) => existingListener !== listener),
    );
  }

  /** internal */
  async emit<K extends keyof Events>(event: K, ...args: Parameters<Events[K]>) {
    const listeners = this.listeners.get(event);

    if (listeners) {
      for (const listener of listeners) {
        const maybePromise = listener(...args);
        if (maybePromise?.then) {
          await maybePromise;
        }
      }
    }
  }
}
