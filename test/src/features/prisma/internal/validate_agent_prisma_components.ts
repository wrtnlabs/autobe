import { orchestratePrismaComponents } from "@autobe/agent/src/orchestrate/prisma/orchestratePrismaComponent";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeAssistantMessageHistory,
  AutoBePrismaComponentEvent,
} from "@autobe/interface";
import { AutoBeExampleProject } from "@autobe/interface";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { prepare_agent_prisma } from "./prepare_agent_prisma";

export const validate_agent_prisma_components = async (props: {
  factory: TestFactory;
  vendor: string;
  project: AutoBeExampleProject;
}) => {
  if (TestGlobal.env.OPENAI_API_KEY === undefined) return false;

  const { agent } = await prepare_agent_prisma(props);
  const result: AutoBePrismaComponentEvent | AutoBeAssistantMessageHistory =
    await orchestratePrismaComponents(
      agent.getContext(),
      "Design database without violation of normalization and integrity rules.",
    );
  if (result.type !== "prismaComponent")
    throw new Error("Failed to orchestrate prisma components");
  else if (TestGlobal.archive)
    await AutoBeExampleStorage.save({
      vendor: props.vendor,
      project: props.project,
      files: {
        [`prisma.components.json`]: JSON.stringify(result),
      },
    });
};
