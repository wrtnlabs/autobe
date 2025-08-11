import { TestFactory } from "../../TestFactory";
import { validate_agent_interface_authorizations } from "./internal/validate_agent_interface_authorizations";

export const test_agent_interface_authorizations_shopping = (
  factory: TestFactory,
) => validate_agent_interface_authorizations(factory, "shopping-backend");
