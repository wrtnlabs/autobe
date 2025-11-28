import { TestFactory } from "../../TestFactory";
import { TestGlobal } from "../../TestGlobal";
import { validate_agent_test_write_prepare } from "./internal/validate_agent_test_write_prepare";

export const test_agent_test_write_prepare_bbs = (factory: TestFactory) =>
  validate_agent_test_write_prepare({
    factory,
    project: "bbs",
    vendor: TestGlobal.vendorModel,
  });
