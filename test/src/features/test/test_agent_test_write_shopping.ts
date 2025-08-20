import { TestFactory } from "../../TestFactory";
import { validate_agent_test_write } from "./internal/validate_agent_test_write";

export const test_agent_test_write_shopping = (factory: TestFactory) =>
  validate_agent_test_write(factory, "shopping");
