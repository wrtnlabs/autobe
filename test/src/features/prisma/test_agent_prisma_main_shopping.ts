import { TestFactory } from "../../TestFactory";
import { validate_agent_prisma_main } from "./internal/validate_agent_prisma_main";

export const test_agent_prisma_main_shopping = (factory: TestFactory) =>
  validate_agent_prisma_main(factory, "shopping-backend");
