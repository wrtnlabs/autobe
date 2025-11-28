import { TestFactory } from "../../TestFactory";
import { TestGlobal } from "../../TestGlobal";
import { validate_agent_test_write_generation } from "./internal/validate_agent_test_write_generation";

export const test_agent_test_write_generation_todo = (factory: TestFactory) =>
  validate_agent_test_write_generation({
    factory,
    project: "todo",
    vendor: TestGlobal.vendorModel,
  });
