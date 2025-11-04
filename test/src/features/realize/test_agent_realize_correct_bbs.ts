import { TestFactory } from "../../TestFactory";
import { TestGlobal } from "../../TestGlobal";
import { validate_agent_realize_correct } from "./internal/validate_agent_realize_correct";

export const test_agent_realize_correct_bbs = (factory: TestFactory) =>
  validate_agent_realize_correct({
    factory,
    project: "bbs",
    vendor: TestGlobal.vendorModel,
  });
