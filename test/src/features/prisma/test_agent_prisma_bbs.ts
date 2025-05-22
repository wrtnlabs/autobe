import { validate_agent_prisma } from "./internal/validate_agent_prisma";

export const test_agent_prisma_bbs = () =>
  validate_agent_prisma("samchon", "bbs-backend");
