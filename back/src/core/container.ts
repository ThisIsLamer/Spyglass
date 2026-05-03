type Constructor<T = any> = new (...args: any[]) => T;

class Container {
  private instances = new Map<Constructor, any>();
  private singletons = new Set<Constructor>();

  register<T>(token: Constructor<T>, asSingleton = false): void {
    if (asSingleton) {
      this.singletons.add(token);
    }
  }

  resolve<T>(token: Constructor<T>): T {
    if (this.singletons.has(token)) {
      if (!this.instances.has(token)) {
        this.instances.set(token, new token());
      }
      return this.instances.get(token);
    }
    return new token();
  }

  clear(): void {
    this.instances.clear();
    this.singletons.clear();
  }
}

export const container = new Container();

export function Injectable(asSingleton = false) {
  return function <T extends Constructor>(target: T, _context: ClassDecoratorContext) {
    container.register(target, asSingleton);
    return target;
  };
}

export function Inject<T>(token: Constructor<T>): T {
  return container.resolve(token);
}
