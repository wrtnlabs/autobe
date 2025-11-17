import { ILlmSchema } from "@samchon/openapi";
import { Pair, Semaphore } from "tstl";
import { v7 } from "uuid";

import { AutoBeConfigConstant } from "../constants/AutoBeConfigConstant";
import { AutoBeContext } from "../context/AutoBeContext";

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
    new Array(semaphore).map(async () => {
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

type Task<T> = (user: string) => Promise<T>;
