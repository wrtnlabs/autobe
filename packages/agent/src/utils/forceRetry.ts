import { AutoBeTimeoutError } from "./AutoBeTimeoutError";

export const forceRetry = async <T>(
  task: () => Promise<T>,
  count: number,
): Promise<T> => {
  let error: unknown = undefined;
  for (let i: number = 0; i < count; ++i)
    try {
      return await task();
    } catch (e) {
      if (e instanceof AutoBeTimeoutError) throw e;
      error = e;
    }
  throw error;
};
