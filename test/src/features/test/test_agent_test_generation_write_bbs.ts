import { TestFactory } from "../../TestFactory";
import { TestGlobal } from "../../TestGlobal";
import { validate_agent_test_generation_write } from "./internal/validate_agent_test_generation_write";

export const test_agent_test_generation_write_bbs = (factory: TestFactory) =>
  validate_agent_test_generation_write({
    factory,
    project: "bbs",
    vendor: TestGlobal.vendorModel,
  });
