import { IAutoBePlaygroundBenchmark } from "@autobe/interface";
import pApi from "@autobe/playground-api";
import { TestValidator } from "@nestia/e2e";

export const test_api_playground_example_index = async (
  connection: pApi.IConnection,
): Promise<void> => {
  const benchmarks: IAutoBePlaygroundBenchmark[] =
    await pApi.functional.autobe.playground.examples.index(connection);

  // Must have at least one benchmark available
  TestValidator.predicate("has benchmarks", () => benchmarks.length > 0);

  // Each benchmark must have valid structure
  for (const benchmark of benchmarks) {
    TestValidator.predicate(
      "vendor is non-empty",
      () => benchmark.vendor.length > 0,
    );
    TestValidator.predicate("has replays", () => benchmark.replays.length > 0);
    for (const replay of benchmark.replays) {
      TestValidator.predicate(
        "replay vendor matches",
        () => replay.vendor === benchmark.vendor,
      );
      TestValidator.predicate(
        "replay project is non-empty",
        () => replay.project.length > 0,
      );
    }
  }

  // Verify no duplicate vendors
  const vendors = benchmarks.map((b) => b.vendor);
  const uniqueVendors = new Set(vendors);
  TestValidator.equals(
    "no duplicate vendors",
    vendors.length,
    uniqueVendors.size,
  );
};
