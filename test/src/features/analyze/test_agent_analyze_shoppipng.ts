import { TestFactory } from "../../TestFactory";
import { validate_agent_analyze } from "./internal/validate_agent_analyze";

export const test_agent_analyze_bbs = (factory: TestFactory) =>
  validate_agent_analyze(factory, "shopping-backend");
