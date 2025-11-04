import { TestFactory } from "../../TestFactory";
import { TestGlobal } from "../../TestGlobal";
import { validate_agent_interface_prerequisites } from "./internal/validate_agent_interface_prerequisites";

export const test_agent_interface_prerequisites_reddit = (
  factory: TestFactory,
) =>
  validate_agent_interface_prerequisites({
    factory,
    project: "reddit",
    vendor: TestGlobal.vendorModel,
  });
