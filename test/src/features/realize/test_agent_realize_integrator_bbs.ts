import { TestFactory } from "../../TestFactory";
import { validate_agent_realize_integrator } from "./internal/validate_agent_realize_integrator";

export const test_agent_realize_integrator_bbs = (factory: TestFactory) =>
  validate_agent_realize_integrator(factory, "bbs-backend");
