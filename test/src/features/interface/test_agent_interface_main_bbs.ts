import { validate_agent_interface_main } from "./internal/validate_agent_interface_main";

export const test_agent_interface_main_bbs = () =>
  validate_agent_interface_main("samchon", "bbs-backend");
