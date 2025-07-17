import { TestFactory } from "../../TestFactory";
import { validate_agent_realize_main } from "./internal/validate_agent_realize_main";

export const test_agent_realize_main_bbs = (factory: TestFactory) =>
  validate_agent_realize_main(factory, "bbs-backend");
