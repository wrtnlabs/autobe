import { TestFactory } from "../../TestFactory";
import { TestGlobal } from "../../TestGlobal";
import { validate_agent_interface_schemas } from "./internal/validate_agent_interface_schemas";

export const test_agent_interface_schemas_bbs = (factory: TestFactory) =>
  validate_agent_interface_schemas({
    factory,
    project: "bbs",
    vendor: TestGlobal.vendorModel,
  });
