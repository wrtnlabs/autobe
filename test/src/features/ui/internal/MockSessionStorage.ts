export class MockSessionStorage {
  public readonly store: Map<string, string> = new Map();
  public readonly calls = {
    getItem: [] as string[],
    setItem: [] as Array<[string, string]>,
    removeItem: [] as string[],
    clear: 0,
  };
  public setItemError: Error | null = null;

  public getItem(key: string): string | null {
    this.calls.getItem.push(key);
    return this.store.get(key) ?? null;
  }

  public setItem(key: string, value: string): void {
    this.calls.setItem.push([key, value]);
    if (this.setItemError !== null) throw this.setItemError;
    this.store.set(key, value);
  }

  public removeItem(key: string): void {
    this.calls.removeItem.push(key);
    this.store.delete(key);
  }

  public clear(): void {
    this.calls.clear += 1;
    this.store.clear();
  }

  public reset(): void {
    this.store.clear();
    this.calls.getItem.length = 0;
    this.calls.setItem.length = 0;
    this.calls.removeItem.length = 0;
    this.calls.clear = 0;
    this.setItemError = null;
  }
}

export const installBrowserStorageMocks = (
  storage: MockSessionStorage,
): void => {
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    writable: true,
    value: storage,
  });
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    writable: true,
    value: { sessionStorage: storage },
  });
};

export const installBase64Mocks = (): void => {
  if (typeof btoa !== "function") {
    Object.defineProperty(globalThis, "btoa", {
      configurable: true,
      writable: true,
      value: (value: string): string =>
        Buffer.from(value, "binary").toString("base64"),
    });
  }
  if (typeof atob !== "function") {
    Object.defineProperty(globalThis, "atob", {
      configurable: true,
      writable: true,
      value: (value: string): string =>
        Buffer.from(value, "base64").toString("binary"),
    });
  }
};
