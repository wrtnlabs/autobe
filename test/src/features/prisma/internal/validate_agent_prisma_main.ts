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
import fs from "fs";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { TestProject } from "../../../structures/TestProject";
import { prepare_agent_prisma } from "./prepare_agent_prisma";

export const validate_agent_prisma_main = async (
  factory: TestFactory,
  project: TestProject,
) => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined) return false;

  const { agent } = await prepare_agent_prisma(factory, project);
  const starts: AutoBePrismaStartEvent[] = [];
  agent.on("prismaStart", (event) => {
    console.log("started");
    starts.push(event);
  });
  agent.on("prismaSchemas", (event) => {
    console.log("progress", event.completed, "of", event.total);
  });

  const validates: AutoBePrismaValidateEvent[] = [];
  agent.on("prismaCorrect", async (event) => {
    await FileSystemIterator.save({
      root: `${TestGlobal.ROOT}/results/${project}/prisma-correct-${validates.length}`,
      files: Object.fromEntries([
        ["errors.json", JSON.stringify(event.failure.errors, null, 2)],
        ["correction.json", JSON.stringify(event.correction, null, 2)],
        ["planning.md", event.planning],
      ]),
    });
  });
  agent.on("prismaValidate", async (event) => {
    validates.push(event);
    await FileSystemIterator.save({
      root: `${TestGlobal.ROOT}/results/${project}/prisma-failure-${validates.length}`,
      files: {
        "errors.json": JSON.stringify(event.result.errors, null, 2),
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
  }
  if (history.compiled.type !== "success") {
    await FileSystemIterator.save({
      root: `${TestGlobal.ROOT}/results/${project}/prisma-error`,
      files: {
        "result.json": JSON.stringify(history.result, null, 2),
        ...history.schemas,
        ...(history.compiled.type === "failure"
          ? {
              "reason.log": history.compiled.reason,
            }
          : {
              "error.json": JSON.stringify(history.compiled.error, null, 2),
            }),
      },
    });
    throw new Error("Prisma validation failed.");
  }

  // REPORT RESULT
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${project}/prisma`,
    files: {
      ...(await agent.getFiles()),
      "logs/validates.json": JSON.stringify(validates, null, 2),
      "logs/result.json": JSON.stringify(history, null, 2),
      "logs/files.json": JSON.stringify(Object.keys(agent.getFiles()), null, 2),
      "logs/result-files.json": JSON.stringify(
        Object.keys({
          ...history.compiled.nodeModules,
          ...history.compiled.schemas,
        }),
        null,
        2,
      ),
      "logs/tokenUsage.json": JSON.stringify(agent.getTokenUsage(), null, 2),
      "logs/components.json": JSON.stringify(components, null, 2),
      "logs/schemas.json": JSON.stringify(schemas, null, 2),
      "logs/starts.json": JSON.stringify(starts, null, 2),
    },
  });
  if (process.argv.includes("--archive"))
    await fs.promises.writeFile(
      `${TestGlobal.ROOT}/assets/histories/${project}.prisma.json`,
      JSON.stringify(agent.getHistories(), null, 2),
      "utf8",
    );
};
