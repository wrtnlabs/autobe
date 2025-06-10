import { validate_agent_prisma } from "./internal/validate_agent_prisma";

export const test_agent_prisma_sns = () =>
  validate_agent_prisma("kakasoo", "sns");
