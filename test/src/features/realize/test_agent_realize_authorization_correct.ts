import { TestFactory } from "../../TestFactory";
import { validate_agent_realize_authorization_correct } from "./internal/validate_agent_realize_authorization_correct";

export const test_agent_realize_authorization_correct = async (
  factory: TestFactory,
) => {
  await validate_agent_realize_authorization_correct(factory, "bbs");
};
