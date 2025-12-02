import { TestFactory } from "../../TestFactory";
import { TestGlobal } from "../../TestGlobal";
import { validate_agent_test_prepare_write } from "./internal/validate_agent_test_prepare_write";

export const test_agent_test_prepare_write_todo = (factory: TestFactory) =>
  validate_agent_test_prepare_write({
    factory,
    project: "todo",
    vendor: TestGlobal.vendorModel,
  });
