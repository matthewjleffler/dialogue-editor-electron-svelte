type Listener = (...values: unknown[]) => void;
type Cleanup = () => void;

export class EventDispatcher<T> {
  private listeners = new Map<T, Set<Listener>>();

  private getListeners(event: T): Set<Listener> {
    const listeners = this.listeners.get(event);
    if (listeners) {
      return listeners;
    }

    const newSet = new Set<Listener>();
    this.listeners.set(event, newSet);
    return newSet;
  }

  addListener(event: T, listener: Listener): Cleanup {
    const listenerSet = this.getListeners(event);
    listenerSet.add(listener);
    const cleanup = () => {
      listenerSet.delete(listener);
    }
    return cleanup;
  }

  dispatch(event: T, ...values: unknown[]) {
    const listenerSet = this.getListeners(event);
    for (const listener of listenerSet) {
      listener(...values);
    }
  }
}
