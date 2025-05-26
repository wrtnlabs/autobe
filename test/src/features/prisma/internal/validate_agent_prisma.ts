import { orchestrate } from "@autobe/agent";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeAssistantMessageHistory,
  AutoBePrismaHistory,
  AutoBePrismaStartEvent,
  AutoBePrismaValidateEvent,
} from "@autobe/interface";
import { AutoBePrismaComponentsEvent } from "@autobe/interface/src/events/AutoBePrismaComponentsEvent";
import { AutoBePrismaSchemasEvent } from "@autobe/interface/src/events/AutoBePrismaSchemasEvent";

import { TestGlobal } from "../../../TestGlobal";
import { prepare_agent_prisma } from "./prepare_agent_prisma";

export const validate_agent_prisma = async (owner: string, project: string) => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined) return false;

  const { agent } = await prepare_agent_prisma(owner, project);
  const starts: AutoBePrismaStartEvent[] = [];
  agent.on("prismaStart", (event) => {
    starts.push(event);
  });

  const validates: AutoBePrismaValidateEvent[] = [];
  agent.on("prismaValidate", (event) => {
    validates.push(event);
  });

  const components: AutoBePrismaComponentsEvent[] = [];
  agent.on("prismaComponents", (event) => {
    components.push(event);
  });

  const schemas: AutoBePrismaSchemasEvent[] = [];
  agent.on("prismaSchemas", (event) => {
    schemas.push(event);
  });

  let result: AutoBePrismaHistory | AutoBeAssistantMessageHistory =
    await orchestrate.prisma(agent.getContext())({
      reason:
        "Step to the Prisma DB schema generation after requirements analysis",
    });
  if (result.type !== "prisma") {
    result = await orchestrate.prisma(agent.getContext())({
      reason: "Don't ask me to do that, and just do it right now.",
    });
    if (result.type !== "prisma")
      throw new Error("History type must be prisma.");
  }

  // REPORT RESULT
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${owner}/${project}/prisma`,
    files: {
      ...agent.getFiles(),
      "logs/validates.json": JSON.stringify(validates, null, 2),
      "logs/result.json": JSON.stringify(result, null, 2),
      "logs/tokenUsage.json": JSON.stringify(agent.getTokenUsage(), null, 2),
      "logs/components.json": JSON.stringify(components, null, 2),
      "logs/schemas.json": JSON.stringify(schemas, null, 2),
      "logs/starts.json": JSON.stringify(starts, null, 2),
    },
  });
};
