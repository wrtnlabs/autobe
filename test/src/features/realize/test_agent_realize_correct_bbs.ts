import { TestFactory } from "../../TestFactory";
import { validate_agent_realize_correct } from "./internal/validate_agent_realize_correct";

export const test_agent_realize_correct_bbs = async (factory: TestFactory) => {
  await validate_agent_realize_correct(factory, "bbs");
};
