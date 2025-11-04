import { AutoBeAgent, AutoBeTokenUsage } from "@autobe/agent";
import { AutoBeState } from "@autobe/agent/src/context/AutoBeState";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { AutoBeHistory } from "@autobe/interface";
import { AutoBeExampleProject } from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";

export const prepare_agent_interface = async (props: {
  factory: TestFactory;
  project: AutoBeExampleProject;
  vendor: string;
}) => {
  if (TestGlobal.env.OPENAI_API_KEY === undefined)
    throw new Error("No OpenAI API key provided");

  const histories: AutoBeHistory[] = await AutoBeExampleStorage.getHistories({
    vendor: props.vendor,
    project: props.project,
    phase: "prisma",
  });
  const agent: AutoBeAgent<ILlmSchema.Model> =
    props.factory.createAgent(histories);
  const state: AutoBeState = agent.getContext().state();
  return {
    agent,
    analyze: state.analyze!,
    prisma: state.prisma!,
    zero: await getZeroTokenUsage(props),
  };
};

const getZeroTokenUsage = async (props: {
  vendor: string;
  project: AutoBeExampleProject;
  factory: TestFactory;
}): Promise<AutoBeTokenUsage> => {
  const zero: AutoBeTokenUsage = new AutoBeTokenUsage(
    await AutoBeExampleStorage.getTokenUsage({
      vendor: props.vendor,
      project: props.project,
      phase: "prisma",
    }),
  );
  zero.decrement(props.factory.getTokenUsage());
  return zero;
};
