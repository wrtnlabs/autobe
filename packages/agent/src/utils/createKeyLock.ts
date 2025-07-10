export function createKeyLock() {
  return (() => {
    const locks = new Map<string, Promise<void>>();

    async function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
      const prev = locks.get(key) ?? Promise.resolve();

      let release: () => void = () => {};
      const current = new Promise<void>((res) => {
        release = res;
      });

      locks.set(
        key,
        prev.then(() => current),
      );

      try {
        await prev;
        return await fn();
      } finally {
        release();
        if (locks.get(key) === current) {
          locks.delete(key);
        }
      }
    }

    return {
      withLock,
    };
  })();
}
