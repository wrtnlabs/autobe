import { TestFactory } from "../../TestFactory";
import { validate_agent_realize_decorator } from "./internal/validate_agent_realize_decorator";

export const test_agent_realize_decorator_shopping = async (
  factory: TestFactory,
) => {
  await validate_agent_realize_decorator(factory, "shopping-backend");
};
