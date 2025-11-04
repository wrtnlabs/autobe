import { AutoBeAgent, AutoBeTokenUsage } from "@autobe/agent";
import { AutoBeState } from "@autobe/agent/src/context/AutoBeState";
import { AutoBeHistory } from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { ArchiveStorage } from "../../../archive/utils/ArchiveStorage";
import { TestProject } from "../../../structures/TestProject";

export const prepare_agent_test = async (props: {
  factory: TestFactory;
  vendor: string;
  project: TestProject;
}) => {
  if (TestGlobal.env.OPENAI_API_KEY === undefined)
    throw new Error("No OpenAI API key provided");

  const histories: AutoBeHistory[] = await ArchiveStorage.getHistories({
    project: props.project,
    phase: "interface",
    vendor: props.vendor,
  });
  const agent: AutoBeAgent<ILlmSchema.Model> =
    props.factory.createAgent(histories);
  const state: AutoBeState = agent.getContext().state();

  return {
    agent,
    analyze: state.analyze!,
    prisma: state.prisma!,
    interface: state.interface!,
    zero: await getZeroTokenUsage(props),
  };
};

const getZeroTokenUsage = async (props: {
  factory: TestFactory;
  vendor: string;
  project: TestProject;
}): Promise<AutoBeTokenUsage> => {
  const zero: AutoBeTokenUsage = new AutoBeTokenUsage(
    await ArchiveStorage.getTokenUsage({
      vendor: props.vendor,
      project: props.project,
      phase: "interface",
    }),
  );
  zero.decrement(props.factory.getTokenUsage());
  return zero;
};
