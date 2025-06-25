import { TestFactory } from "../../TestFactory";
import { validate_agent_interface_complement } from "./internal/validate_agent_interface_complement";

export const test_agent_interface_complement_shopping = (
  factory: TestFactory,
) => validate_agent_interface_complement(factory, "shopping-backend");
