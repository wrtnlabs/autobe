import { TestFactory } from "../../TestFactory";
import { validate_agent_interface_endpoints } from "./internal/validate_agent_interface_endpoints";

export const test_agent_interface_endpoints_shopping = (factory: TestFactory) =>
  validate_agent_interface_endpoints(factory, "shopping");
