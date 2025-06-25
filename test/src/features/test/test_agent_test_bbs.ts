import { TestFactory } from "../../TestFactory";
import { validate_agent_test_main } from "./internal/validate_agent_test_main";

export const test_agent_test_bbs = (factory: TestFactory) =>
  validate_agent_test_main(factory, "bbs-backend");
