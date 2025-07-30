import { AutoBeAgent } from "@autobe/agent";
import { AutoBeState } from "@autobe/agent/src/context/AutoBeState";
import { AutoBeHistory } from "@autobe/interface";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { TestHistory } from "../../../internal/TestHistory";
import { TestProject } from "../../../structures/TestProject";

export const prepare_agent_interface = async (
  factory: TestFactory,
  project: TestProject,
) => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined)
    throw new Error("No OpenAI API key provided");

  const histories: AutoBeHistory[] = await TestHistory.getPrisma(project);
  const agent: AutoBeAgent<"chatgpt"> = factory.createAgent(
    histories,
    process.argv.includes("--archive")
      ? await TestHistory.getTokenUsage({
          project,
          type: "prisma",
        })
      : undefined,
  );
  const state: AutoBeState = agent.getContext().state();
  return {
    agent,
    analyze: state.analyze!,
    prisma: state.prisma!,
  };
};
