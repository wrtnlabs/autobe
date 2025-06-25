import { TestFactory } from "../../TestFactory";
import { validate_agent_interface_components } from "./internal/validate_agent_interface_components";

export const test_agent_interface_components_shopping = (
  factory: TestFactory,
) => validate_agent_interface_components(factory, "shopping-backend");
