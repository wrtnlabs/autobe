import { TestFactory } from "../../TestFactory";
import { validate_agent_prisma } from "./internal/validate_agent_prisma";

export const test_agent_prisma_shopping = (factory: TestFactory) =>
  validate_agent_prisma(factory, "shopping-backend");
