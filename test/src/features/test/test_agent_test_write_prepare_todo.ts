import { TestFactory } from "../../TestFactory";
import { TestGlobal } from "../../TestGlobal";
import { validate_agent_test_write_prepare } from "./internal/validate_agent_test_write_prepare";

export const test_agent_test_write_prepare_todo = (factory: TestFactory) =>
  validate_agent_test_write_prepare({
    factory,
    project: "todo",
    vendor: TestGlobal.vendorModel,
  });
