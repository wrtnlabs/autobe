import { TestFactory } from "../../TestFactory";
import { validate_agent_interface_schema_reviewer } from "./internal/validate_agent_interface_schema_reviewer";

export const test_agent_interface_schema_reviewer_shopping = (factory: TestFactory) =>
  validate_agent_interface_schema_reviewer(factory, "shopping-backend");