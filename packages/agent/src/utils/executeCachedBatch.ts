import { ILlmSchema } from "@samchon/openapi";
import { Semaphore } from "tstl";
import { v7 } from "uuid";

import { AutoBeConfigConstant } from "../constants/AutoBeConfigConstant";
import { AutoBeContext } from "../context/AutoBeContext";

export const executeCachedBatch = async <Model extends ILlmSchema.Model, T>(
  ctx: AutoBeContext<Model>,
  tasks: Array<(user: string) => Promise<T>>,
  promptCacheKey?: string,
): Promise<T[]> => {
  if (tasks.length === 0) return [];

  promptCacheKey ??= v7();
  const first: T = await tasks[0]!(promptCacheKey);
  const semaphore: number =
    ctx.vendor.semaphore && ctx.vendor.semaphore instanceof Semaphore
      ? ctx.vendor.semaphore.max()
      : (ctx.vendor.semaphore ?? AutoBeConfigConstant.SEMAPHORE);

  const remained: Array<(user: string) => Promise<T>> = tasks.slice(1);
  const tail: T[] = [];
  while (remained.length !== 0) {
    const batch: Array<(user: string) => Promise<T>> = remained.splice(
      0,
      semaphore,
    );
    const results: T[] = await Promise.all(
      batch.map((task) => task(promptCacheKey)),
    );
    tail.push(...results);
  }
  return [first, ...tail];
};
