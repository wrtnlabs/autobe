import { validate_agent_interface_components } from "./internal/validate_agent_interface_components";

export const test_agent_interface_components_shopping = () =>
  validate_agent_interface_components("samchon", "shopping-backend");
