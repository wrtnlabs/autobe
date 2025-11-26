import { TestFactory } from "../../TestFactory";
import { TestGlobal } from "../../TestGlobal";
import { validate_agent_test_prepare } from "./internal/validate_agent_test_prepare";

export const test_agent_test_prepare_todo = (factory: TestFactory) =>
  validate_agent_test_prepare({
    factory,
    project: "todo",
    vendor: TestGlobal.vendorModel,
  });