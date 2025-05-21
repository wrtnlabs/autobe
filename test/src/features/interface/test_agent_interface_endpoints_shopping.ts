import { validate_agent_interface_endpoints } from "./internal/validate_agent_interface_endpoints";

export const test_agent_interface_endpoints_shopping = () =>
  validate_agent_interface_endpoints("samchon", "shopping-backend");
