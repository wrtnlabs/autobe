import { TestFactory } from "../../TestFactory";
import { TestGlobal } from "../../TestGlobal";
import { validate_agent_realize_collector_write } from "./internal/validate_agent_realize_collector_write";

export const test_agent_realize_collector_write_todo = (factory: TestFactory) =>
  validate_agent_realize_collector_write({
    factory,
    project: "todo",
    vendor: TestGlobal.vendorModel,
  });
