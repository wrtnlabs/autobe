import { AutoBeAgent } from "@autobe/agent";
import { AutoBeState } from "@autobe/agent/src/context/AutoBeState";
import { AutoBeHistory } from "@autobe/interface";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { TestHistory } from "../../../internal/TestHistory";
import { TestProject } from "../../../structures/TestProject";

export const prepare_agent_prisma = async (
  factory: TestFactory,
  project: TestProject,
) => {
  if (TestGlobal.env.API_KEY === undefined)
    throw new Error("No OpenAI API key provided");

  const histories: AutoBeHistory[] = await TestHistory.getAnalyze(project);
  const agent: AutoBeAgent<"chatgpt"> = factory.createAgent(
    histories,
    process.argv.includes("--archive")
      ? await TestHistory.getTokenUsage({
          project,
          type: "analyze",
        })
      : undefined,
  );
  const state: AutoBeState = agent.getContext().state();
  return {
    agent,
    analyze: state.analyze!,
  };
};
