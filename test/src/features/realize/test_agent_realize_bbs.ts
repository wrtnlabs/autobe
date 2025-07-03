import { TestFactory } from "../../TestFactory";
import { validate_agent_realize } from "./internal/validate_agent_realize";

export const test_agent_realize_bbs = (factory: TestFactory) =>
  validate_agent_realize(factory, "bbs-backend");
