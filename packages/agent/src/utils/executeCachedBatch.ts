import { ILlmSchema } from "@samchon/openapi";
import { Pair, Semaphore } from "tstl";
import { v7 } from "uuid";

import { AutoBeConfigConstant } from "../constants/AutoBeConfigConstant";
import { AutoBeContext } from "../context/AutoBeContext";

/**
 * Executes task list with prompt caching optimization and semaphore-controlled
 * parallelization.
 *
 * This is the core performance optimization pattern in AutoBE: first task runs
 * sequentially to establish prompt cache, then remaining tasks execute in
 * parallel with the same cache key, dramatically reducing token costs and
 * latency. The semaphore limits concurrency to prevent overwhelming LLM APIs.
 *
 * For example, generating 100 API operations: first operation takes 30s and
 * costs full token price, but the remaining 99 operations run in parallel
 * (respecting semaphore limit) and benefit from 90% cost reduction via cached
 * system prompts. Total time: ~35s instead of 50 minutes, cost: ~10% of
 * uncached price.
 *
 * Without this pattern, AutoBE would be economically and temporally infeasible
 * for real-world applications with dozens of database models and API
 * endpoints.
 *
 * @param ctx Execution context providing vendor semaphore configuration
 * @param taskList List of async tasks to execute, each receiving cache key
 * @param promptCacheKey Optional cache key (generates UUID if not provided)
 * @returns Array of task results in original order
 */
export const executeCachedBatch = async <Model extends ILlmSchema.Model, T>(
  ctx: AutoBeContext<Model>,
  taskList: Task<T>[],
  promptCacheKey?: string,
): Promise<T[]> => {
  if (taskList.length === 0) return [];

  promptCacheKey ??= v7();
  const first: T = await taskList[0]!(promptCacheKey);
  const semaphore: number =
    ctx.vendor.semaphore && ctx.vendor.semaphore instanceof Semaphore
      ? ctx.vendor.semaphore.max()
      : (ctx.vendor.semaphore ?? AutoBeConfigConstant.SEMAPHORE);

  const remained: Array<Pair<Task<T>, number>> = taskList
    .slice(1)
    .map((task, index) => new Pair(task, index));
  const tail: Pair<T, number>[] = [];
  await Promise.all(
    new Array(semaphore).fill(0).map(async () => {
      while (remained.length !== 0) {
        const batch: Pair<Task<T>, number> = remained.splice(0, 1)[0]!;
        const result: T = await batch.first(promptCacheKey!);
        tail.push(new Pair(result, batch.second));
      }
    }),
  );
  return [
    first,
    ...tail.sort((x, y) => x.second - y.second).map((p) => p.first),
  ];
};

/**
 * Task function that receives cache key and returns result.
 *
 * The cache key (typically UUID) is used as user message to trigger prompt
 * cache reuse across multiple LLM API calls with identical system prompts.
 */
type Task<T> = (user: string) => Promise<T>;
