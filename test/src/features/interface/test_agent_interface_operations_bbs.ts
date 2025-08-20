import { TestFactory } from "../../TestFactory";
import { validate_agent_interface_operations } from "./internal/validate_agent_interface_operations";

export const test_agent_interface_operations_bbs = (factory: TestFactory) =>
  validate_agent_interface_operations(factory, "bbs");
