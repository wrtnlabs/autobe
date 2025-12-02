import { TestFactory } from "../../TestFactory";
import { TestGlobal } from "../../TestGlobal";
import { validate_agent_test_authorization_write } from "./internal/validate_agent_test_authorization_write";

export const test_agent_test_authorization_write_reddit = (factory: TestFactory) =>
  validate_agent_test_authorization_write({
    factory,
    project: "reddit",
    vendor: TestGlobal.vendorModel,
  });