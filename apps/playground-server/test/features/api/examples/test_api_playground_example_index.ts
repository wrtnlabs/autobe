import { IAutoBePlaygroundExample } from "@autobe/interface";
import pApi from "@autobe/playground-api";
import { TestValidator } from "@nestia/e2e";

export const test_api_playground_example_index = async (
  connection: pApi.IConnection,
): Promise<void> => {
  const examples: IAutoBePlaygroundExample[] =
    await pApi.functional.autobe.playground.examples.index(connection);

  // Must have at least one example available (from autobe-examples storage)
  TestValidator.predicate(
    "has examples",
    () => examples.length > 0,
  );

  // Each example must have valid structure
  for (const example of examples) {
    TestValidator.predicate(
      "vendor is non-empty",
      () => example.vendor.length > 0,
    );
    TestValidator.predicate(
      "project is non-empty",
      () => example.project.length > 0,
    );
    TestValidator.predicate(
      "has at least one phase",
      () => example.phases.length > 0,
    );

    // Phases must be valid
    const validPhases = ["analyze", "database", "interface", "test", "realize"];
    for (const phase of example.phases) {
      TestValidator.predicate(
        `valid phase: ${phase}`,
        () => validPhases.includes(phase),
      );
    }
  }

  // Verify no duplicate vendor+project combinations
  const keys = examples.map((e) => `${e.vendor}/${e.project}`);
  const uniqueKeys = new Set(keys);
  TestValidator.equals("no duplicates", keys.length, uniqueKeys.size);
};
