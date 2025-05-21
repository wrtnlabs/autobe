import { validate_agent_interface_main } from "./internal/validate_agent_interface_main";

export const test_agent_interface_main_shopping = () =>
  validate_agent_interface_main("samchon", "shopping-backend");
