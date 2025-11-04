import { TestFactory } from "../../TestFactory";
import { TestGlobal } from "../../TestGlobal";
import { validate_agent_test_scenario } from "./internal/validate_agent_test_scenario";

export const test_agent_test_scenario_shopping = (factory: TestFactory) =>
  validate_agent_test_scenario({
    factory,
    project: "shopping",
    vendor: TestGlobal.vendorModel,
  });
