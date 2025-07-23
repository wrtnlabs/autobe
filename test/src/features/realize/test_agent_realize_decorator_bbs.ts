import { TestFactory } from "../../TestFactory";
import { validate_agent_realize_decorator } from "./internal/validate_agent_realize_decorator";

export const test_agent_realize_decorator_bbs = async (
  factory: TestFactory,
) => {
  await validate_agent_realize_decorator(factory, "bbs-backend");
};
