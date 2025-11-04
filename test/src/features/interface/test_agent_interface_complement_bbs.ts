import { TestFactory } from "../../TestFactory";
import { TestGlobal } from "../../TestGlobal";
import { validate_agent_interface_complement } from "./internal/validate_agent_interface_complement";

export const test_agent_interface_complement_bbs = (factory: TestFactory) =>
  validate_agent_interface_complement({
    factory,
    project: "bbs",
    vendor: TestGlobal.vendorModel,
  });
