import { TestFactory } from "../../TestFactory";
import { TestGlobal } from "../../TestGlobal";
import { validate_agent_realize_authorization } from "./internal/validate_agent_realize_authorization";

export const test_agent_realize_authorization_todo = (factory: TestFactory) =>
  validate_agent_realize_authorization({
    factory,
    project: "todo",
    vendor: TestGlobal.vendorModel,
  });
