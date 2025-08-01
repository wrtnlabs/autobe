import { TestFactory } from "../../TestFactory";
import { validate_agent_interface_operation_reviewer } from "./internal/validate_agent_interface_operation_reviewer";

export const test_agent_interface_operation_reviewer_bbs = (factory: TestFactory) =>
  validate_agent_interface_operation_reviewer(factory, "bbs-backend");