import { TestFactory } from "../../TestFactory";
import { validate_agent_test_correct } from "./internal/validate_agent_test_correct";

export const test_agent_test_correct_shopping = (factory: TestFactory) =>
  validate_agent_test_correct(factory, "shopping-backend");
