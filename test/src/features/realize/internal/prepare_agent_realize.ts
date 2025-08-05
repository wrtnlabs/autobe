import { AutoBeAgent, AutoBeTokenUsage } from "@autobe/agent";
import { AutoBeState } from "@autobe/agent/src/context/AutoBeState";
import { AutoBeHistory } from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { TestHistory } from "../../../internal/TestHistory";
import { TestProject } from "../../../structures/TestProject";

export const prepare_agent_realize = async (
  factory: TestFactory,
  project: "bbs-backend" | "shopping-backend",
) => {
  if (TestGlobal.env.API_KEY === undefined)
    throw new Error("No OpenAI API key provided");

  const histories: AutoBeHistory[] = await TestHistory.getTest(project);
  const agent: AutoBeAgent<ILlmSchema.Model> = factory.createAgent(histories);
  const state: AutoBeState = agent.getContext().state();

  return {
    agent,
    analyze: state.analyze!,
    prisma: state.prisma!,
    interface: state.interface!,
    test: state.test!,
    zero: await getZeroTokenUsage(factory, project),
  };
};

const getZeroTokenUsage = async (
  factory: TestFactory,
  project: TestProject,
): Promise<AutoBeTokenUsage> => {
  const zero: AutoBeTokenUsage = new AutoBeTokenUsage(
    await TestHistory.getTokenUsage({
      project,
      type: "test",
    }),
  );
  zero.decrement(factory.getTokenUsage());
  return zero;
};
