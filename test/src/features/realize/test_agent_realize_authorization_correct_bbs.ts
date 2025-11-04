import { TestFactory } from "../../TestFactory";
import { TestGlobal } from "../../TestGlobal";
import { validate_agent_realize_authorization_correct } from "./internal/validate_agent_realize_authorization_correct";

export const test_agent_realize_authorization_correct_bbs = async (
  factory: TestFactory,
) => {
  await validate_agent_realize_authorization_correct({
    factory,
    project: "bbs",
    vendor: TestGlobal.vendorModel,
  });
};
