import { TestFactory } from "../../TestFactory";
import { validate_agent_realize_planner } from "./internal/validate_agent_realize_planner";

export const test_agent_realize_planner_bbs = (factory: TestFactory) =>
  validate_agent_realize_planner(factory, "bbs-backend");
