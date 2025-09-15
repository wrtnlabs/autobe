export class AutoBeTimeoutError extends Error {
  public constructor(message: string) {
    super(message);

    const proto = new.target.prototype;
    if (Object.setPrototypeOf) Object.setPrototypeOf(this, proto);
    else (this as any).__proto__ = proto;
  }

  public get name(): string {
    return this.constructor.name;
  }
}
