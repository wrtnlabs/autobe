import { TestFactory } from "../../TestFactory";
import { TestGlobal } from "../../TestGlobal";
import { validate_agent_realize_collector_correct } from "./internal/validate_agent_realize_collector_correct";

export const test_agent_realize_collector_correct_bbs = (
  factory: TestFactory,
) =>
  validate_agent_realize_collector_correct({
    factory,
    vendor: TestGlobal.vendorModel,
    project: "bbs",
  });
