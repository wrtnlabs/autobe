import { TestFactory } from "../../TestFactory";
import { validate_agent_interface_operation_reviewer } from "./internal/validate_agent_interface_operation_reviewer";

export const test_agent_interface_operation_reviewer_shopping = (factory: TestFactory) =>
  validate_agent_interface_operation_reviewer(factory, "shopping-backend");