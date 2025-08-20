import { TestFactory } from "../../TestFactory";
import { validate_agent_interface_groups } from "./internal/validate_agent_interface_groups";

export const test_agent_interface_groups_shopping = (factory: TestFactory) =>
  validate_agent_interface_groups(factory, "shopping");
