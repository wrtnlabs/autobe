import { executeCachedBatch } from "@autobe/agent/src/utils/executeCachedBatch";
import { TestValidator } from "@nestia/e2e";
import { randint, sleep_for } from "tstl";

export const test_execute_cached_batch = async (): Promise<void> => {
  const key: Set<string> = new Set();
  const input: number[] = new Array(10).fill(0).map((_, i) => i);
  const output: number[] = await executeCachedBatch(
    8,
    input.map((v) => async (promptCacheKey) => {
      await sleep_for(await randint(0, 100));
      key.add(promptCacheKey);
      return v;
    }),
  );
  TestValidator.equals("promptCacheKey", 1, key.size);
  TestValidator.equals("output", input, output);

  try {
    await executeCachedBatch(
      8,
      input.map((_v, i) => async () => {
        if (i === 8) throw new Error("intended error");
      }),
    );
  } catch {
    return;
  }
  throw new Error("Failed to catch error.");
};
