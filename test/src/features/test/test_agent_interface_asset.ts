import { TestValidator } from "@nestia/e2e";

import { TestGlobal } from "../../TestGlobal";
import { prepare_agent_interface } from "./internal/prepare_agent_interface";

export const test_agent_test_asset = async () => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined) return false;

  const state = await prepare_agent_interface("bbs");
  TestValidator.equals("analyze")(!!state.analyze)(true);
  TestValidator.equals("prisma")(state.prisma.compiled.type)("success");
  TestValidator.equals("interface")(!!state.interface)(true);
};
