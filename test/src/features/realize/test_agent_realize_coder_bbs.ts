import { TestFactory } from "../../TestFactory";
import { validate_agent_realize_coder } from "./internal/validate_agent_realize_coder";

export const test_agent_realize_coder_bbs = (factory: TestFactory) =>
  validate_agent_realize_coder(factory, "bbs-backend");
