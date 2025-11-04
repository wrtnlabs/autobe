import { TestFactory } from "../../TestFactory";
import { TestGlobal } from "../../TestGlobal";
import { validate_agent_realize_correct } from "./internal/validate_agent_realize_correct";

export const test_agent_realize_correct_todo = (factory: TestFactory) =>
  validate_agent_realize_correct({
    factory,
    project: "todo",
    vendor: TestGlobal.vendorModel,
  });
