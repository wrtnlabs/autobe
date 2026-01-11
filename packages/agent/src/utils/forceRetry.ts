export const forceRetry = async <T>(
  task: () => Promise<T>,
  count: number,
  predicate: (error: unknown) => boolean,
): Promise<T> => {
  let error: unknown = undefined;
  for (let i: number = 0; i < count; ++i)
    try {
      return await task();
    } catch (e) {
      if (predicate(e) === false) throw e;
      error = e;
    }
  throw error;
};
