import { TestFactory } from "../../TestFactory";
import { validate_agent_realize_scenario } from "./internal/validate_agent_realize_scenario";

export const test_agent_realize_scenario_bbs = async (factory: TestFactory) => {
  await validate_agent_realize_scenario(factory, "bbs-backend");
};
