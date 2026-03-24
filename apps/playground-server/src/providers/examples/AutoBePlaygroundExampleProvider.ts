import { IAutoBePlaygroundBenchmark } from "@autobe/interface";
import fs from "fs";
import path from "path";
import { Singleton } from "tstl";

import { AutoBePlaygroundConfiguration } from "../../AutoBePlaygroundConfiguration";

const benchmarkData = new Singleton((): IAutoBePlaygroundBenchmark[] => {
  const file = path.resolve(
    AutoBePlaygroundConfiguration.ROOT,
    "../../website/src/data/benchmark.json",
  );
  return JSON.parse(fs.readFileSync(file, "utf-8"));
});

export namespace AutoBePlaygroundExampleProvider {
  /**
   * List all available examples from the benchmark storage.
   *
   * Reads pre-computed benchmark data from `website/src/data/benchmark.json`
   * and returns vendor-grouped benchmarks as-is.
   */
  export const index = async (): Promise<IAutoBePlaygroundBenchmark[]> =>
    benchmarkData.get();
}
