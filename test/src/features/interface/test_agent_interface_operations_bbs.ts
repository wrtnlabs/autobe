import { validate_agent_interface_operations } from "./internal/validate_agent_interface_operations";

export const test_agent_interface_operations_bbs = () =>
  validate_agent_interface_operations("samchon", "bbs-backend");
