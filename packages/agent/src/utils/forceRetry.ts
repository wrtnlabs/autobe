export async function forceRetry<T>(
  task: () => Promise<T>,
  count: number = 2,
): Promise<T> {
  let error: unknown = undefined;
  for (let i: number = 0; i <= count; ++i)
    try {
      return await task();
    } catch (e) {
      error = e;
    }
  throw error;
}
