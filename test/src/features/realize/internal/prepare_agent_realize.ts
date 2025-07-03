import { AutoBeAgent } from "@autobe/agent";
import { AutoBeState } from "@autobe/agent/src/context/AutoBeState";
import { AutoBeHistory } from "@autobe/interface";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { TestHistory } from "../../../internal/TestHistory";

export const prepare_agent_realize = async (
  factory: TestFactory,
  project: "bbs-backend" | "shopping-backend",
) => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined)
    throw new Error("No OpenAI API key provided");

  const histories: AutoBeHistory[] = await TestHistory.getTest(project);
  const agent: AutoBeAgent<"chatgpt"> = factory.createAgent(histories);
  const state: AutoBeState = agent.getContext().state();

  return {
    agent,
    analyze: state.analyze!,
    prisma: state.prisma!,
    interface: state.interface!,
    test: state.test!,
  };
};
