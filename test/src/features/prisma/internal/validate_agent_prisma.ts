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
  agent.on("prismaCorrect", async (event) => {
    await FileSystemIterator.save({
      root: `${TestGlobal.ROOT}/results/${owner}/${project}/prisma-correct-${validates.length}`,
      files: Object.fromEntries([
        ["reason.log", event.failure.reason],
        ["planning.md", event.planning],
        ...Object.entries(event.input).map(([k, v]) => [`input/${k}`, v]),
        ...Object.entries(event.correction).map(([k, v]) => [
          `correction/${k}`,
          v,
        ]),
      ]),
    });
  });
  agent.on("prismaValidate", async (event) => {
    validates.push(event);
    if (event.result.type === "failure")
      await FileSystemIterator.save({
        root: `${TestGlobal.ROOT}/results/${owner}/${project}/prisma-failure-${validates.length}`,
        files: {
          "reason.log": event.result.reason,
          ...event.schemas,
        },
      });
  });

  const components: AutoBePrismaComponentsEvent[] = [];
  agent.on("prismaComponents", (event) => {
    components.push(event);
  });

  const schemas: AutoBePrismaSchemasEvent[] = [];
  agent.on("prismaSchemas", (event) => {
    schemas.push(event);
  });

  let history: AutoBePrismaHistory | AutoBeAssistantMessageHistory =
    await orchestrate.prisma(agent.getContext())({
      reason:
        "Step to the Prisma DB schema generation after requirements analysis",
    });
  if (history.type !== "prisma") {
    history = await orchestrate.prisma(agent.getContext())({
      reason: "Don't ask me to do that, and just do it right now.",
    });
    if (history.type !== "prisma")
      throw new Error("History type must be prisma.");
  } else if (history.result.type !== "success")
    throw new Error("Prisma validation failed.");

  // REPORT RESULT
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${owner}/${project}/prisma`,
    files: {
      ...agent.getFiles(),
      "logs/validates.json": JSON.stringify(validates, null, 2),
      "logs/result.json": JSON.stringify(history, null, 2),
      "logs/tokenUsage.json": JSON.stringify(agent.getTokenUsage(), null, 2),
      "logs/components.json": JSON.stringify(components, null, 2),
      "logs/schemas.json": JSON.stringify(schemas, null, 2),
      "logs/starts.json": JSON.stringify(starts, null, 2),
    },
  });
};
