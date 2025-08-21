import { TestFactory } from "../../TestFactory";
import { validate_agent_realize_authorization } from "./internal/validate_agent_realize_authorization";

export const test_agent_realize_authorization_todo = async (
  factory: TestFactory,
) => {
  await validate_agent_realize_authorization(factory, "todo");
};
