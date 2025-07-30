import { TestValidator } from "@nestia/e2e";

import { TestFactory } from "../../TestFactory";
import { TestGlobal } from "../../TestGlobal";
import { prepare_agent_test } from "./internal/prepare_agent_test";

export const test_agent_test_asset = async (factory: TestFactory) => {
  if (TestGlobal.env.API_KEY === undefined) return false;

  const state = await prepare_agent_test(factory, "bbs-backend");
  TestValidator.equals("analyze")(!!state.analyze)(true);
  TestValidator.equals("prisma")(state.prisma.compiled.type)("success");
  TestValidator.equals("interface")(!!state.interface)(true);
};
