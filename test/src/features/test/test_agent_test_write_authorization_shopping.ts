import { TestFactory } from "../../TestFactory";
import { TestGlobal } from "../../TestGlobal";
import { validate_agent_test_write_authorization } from "./internal/validate_agent_test_write_authorization";

export const test_agent_test_write_authorization_shopping = (factory: TestFactory) =>
  validate_agent_test_write_authorization({
    factory,
    project: "shopping",
    vendor: TestGlobal.vendorModel,
  });