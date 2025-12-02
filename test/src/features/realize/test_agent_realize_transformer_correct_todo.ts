import { TestFactory } from "../../TestFactory";
import { TestGlobal } from "../../TestGlobal";
import { validate_agent_realize_transformer_correct } from "./internal/validate_agent_realize_transformer_correct";

export const test_agent_realize_transformer_correct_todo = (
  factory: TestFactory,
) =>
  validate_agent_realize_transformer_correct({
    factory,
    vendor: TestGlobal.vendorModel,
    project: "todo",
  });
