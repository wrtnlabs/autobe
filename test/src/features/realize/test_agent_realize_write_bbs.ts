import { TestFactory } from "../../TestFactory";
import { validate_agent_realize_write } from "./internal/validate_agent_realize_write";

export const test_agent_realize_write_bbs = async (factory: TestFactory) => {
  await validate_agent_realize_write(factory, "bbs-backend");
};
