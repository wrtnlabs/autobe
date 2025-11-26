import { TestFactory } from "../../TestFactory";
import { TestGlobal } from "../../TestGlobal";
import { validate_agent_test_generation } from "./internal/validate_agent_test_generation";

export const test_agent_test_generation_reddit = (factory: TestFactory) =>
  validate_agent_test_generation({
    factory,
    project: "reddit",
    vendor: TestGlobal.vendorModel,
  });