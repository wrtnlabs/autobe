import { TestFactory } from "../../TestFactory";
import { TestGlobal } from "../../TestGlobal";
import { validate_agent_realize_operation_write } from "./internal/validate_agent_realize_operation_write";

export const test_agent_realize_operation_write_todo = (factory: TestFactory) =>
  validate_agent_realize_operation_write({
    factory,
    project: "todo",
    vendor: TestGlobal.vendorModel,
  });
