import { TestFactory } from "../../TestFactory";
import { validate_agent_analyze_main } from "./internal/validate_agent_analyze_main";

export const test_agent_analyze_main_bbs = (factory: TestFactory) =>
  validate_agent_analyze_main(factory, "bbs-backend");
