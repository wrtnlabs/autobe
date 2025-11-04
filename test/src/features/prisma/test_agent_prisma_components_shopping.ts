import { TestFactory } from "../../TestFactory";
import { TestGlobal } from "../../TestGlobal";
import { validate_agent_prisma_components } from "./internal/validate_agent_prisma_components";

export const test_agent_prisma_components_shopping = (factory: TestFactory) =>
  validate_agent_prisma_components({
    factory,
    project: "shopping",
    vendor: TestGlobal.vendorModel,
  });
