import { orchestratePrismaComponents } from "@autobe/agent/src/orchestrate/prisma/orchestratePrismaComponent";
import {
  AutoBeAssistantMessageHistory,
  AutoBePrismaComponentsEvent,
} from "@autobe/interface";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { TestHistory } from "../../../internal/TestHistory";
import { TestProject } from "../../../structures/TestProject";
import { prepare_agent_prisma } from "./prepare_agent_prisma";

export const validate_agent_prisma_components = async (
  factory: TestFactory,
  project: TestProject,
) => {
  if (TestGlobal.env.API_KEY === undefined) return false;

  const { agent } = await prepare_agent_prisma(factory, project);
  const result: AutoBePrismaComponentsEvent | AutoBeAssistantMessageHistory =
    await orchestratePrismaComponents(agent.getContext());
  if (result.type !== "prismaComponents")
    throw new Error("Failed to orchestrate prisma components");
  else if (TestGlobal.archive)
    await TestHistory.save({
      [`${project}.prisma.components.json`]: JSON.stringify(result),
    });
};
