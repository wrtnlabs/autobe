import { Pair, Semaphore } from "tstl";
import { v7 } from "uuid";

import { AutoBeConfigConstant } from "../constants/AutoBeConfigConstant";
import { AutoBeContext } from "../context/AutoBeContext";

/**
 * Executes task list with semaphore-controlled parallelization.
 *
 * All tasks are dispatched immediately into a worker pool, with concurrency
 * limited by the semaphore to prevent overwhelming LLM APIs. Results are
 * returned in original order.
 *
 * @param ctx Execution context providing vendor semaphore configuration
 * @param taskList List of async tasks to execute, each receiving cache key
 * @param promptCacheKey Optional cache key (generates UUID if not provided)
 * @returns Array of task results in original order
 */
export const executeCachedBatch = async <T>(
  ctx: AutoBeContext | number,
  taskList: Task<T>[],
  promptCacheKey?: string,
): Promise<T[]> => {
  if (taskList.length === 0) return [];

  promptCacheKey ??= v7();
  const semaphore: number =
    typeof ctx === "number"
      ? ctx
      : ctx.vendor.semaphore && ctx.vendor.semaphore instanceof Semaphore
        ? ctx.vendor.semaphore.max()
        : (ctx.vendor.semaphore ?? AutoBeConfigConstant.SEMAPHORE);

  const queue: Array<Pair<Task<T>, number>> = taskList.map(
    (task, index) => new Pair(task, index),
  );
  const results: Pair<T, number>[] = [];
  let aborted: boolean = false;
  let firstError: unknown = null;
  await Promise.allSettled(
    new Array(Math.min(semaphore, queue.length)).fill(0).map(async () => {
      while (queue.length !== 0 && !aborted) {
        const item: Pair<Task<T>, number> = queue.splice(0, 1)[0]!;
        try {
          const result: T = await item.first(promptCacheKey!);
          if (!aborted) results.push(new Pair(result, item.second));
        } catch (error) {
          if (!aborted) {
            aborted = true;
            queue.length = 0;
            firstError = error;
          }
        }
      }
    }),
  );
  if (firstError !== null) throw firstError;
  return results.sort((x, y) => x.second - y.second).map((p) => p.first);
};

/**
 * Task function that receives cache key and returns result.
 *
 * The cache key (typically UUID) is used as user message to trigger prompt
 * cache reuse across multiple LLM API calls with identical system prompts.
 */
type Task<T> = (user: string) => Promise<T>;
