import { v7 } from "uuid";

export const executeCachedBatch = async <T>(
  tasks: Array<(user: string) => Promise<T>>,
  promptCacheKey?: string,
): Promise<T[]> => {
  if (tasks.length === 0) return [];

  promptCacheKey ??= v7();
  const first: T = await tasks[0]!(promptCacheKey);
  const tail: T[] = await Promise.all(
    tasks.slice(1).map((task) => task(promptCacheKey)),
  );
  return [first, ...tail];
};
