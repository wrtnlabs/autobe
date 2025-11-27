import { TestFactory } from "../../TestFactory";
import { TestGlobal } from "../../TestGlobal";
import { validate_agent_realize_transformer_write } from "./internal/validate_agent_realize_transformer_write";

export const test_agent_realize_transformer_write_reddit = (
  factory: TestFactory,
) =>
  validate_agent_realize_transformer_write({
    factory,
    vendor: TestGlobal.vendorModel,
    project: "reddit",
  });
