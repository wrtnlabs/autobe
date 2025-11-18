import { TestFactory } from "../../TestFactory";
import { TestGlobal } from "../../TestGlobal";
import { validate_agent_describe_image } from "./internal/validate_agent_describe_image";

export const test_agent_describe_image = async (factory: TestFactory) => {
  await validate_agent_describe_image({
    factory,
    vendor: TestGlobal.vendorModel,
    project: "account",
  });
};
