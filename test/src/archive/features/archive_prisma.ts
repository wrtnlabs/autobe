import { AutoBeTokenUsage, orchestrate } from "@autobe/agent";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeAssistantMessageHistory,
  AutoBeEventOfSerializable,
  AutoBeEventSnapshot,
  AutoBePrismaHistory,
  AutoBePrismaInsufficientEvent,
  AutoBePrismaStartEvent,
  AutoBePrismaValidateEvent,
} from "@autobe/interface";
import { AutoBePrismaComponentsEvent } from "@autobe/interface/src/events/AutoBePrismaComponentsEvent";
import { AutoBePrismaSchemasEvent } from "@autobe/interface/src/events/AutoBePrismaSchemasEvent";
import typia from "typia";

import { TestFactory } from "../../TestFactory";
import { TestGlobal } from "../../TestGlobal";
import { prepare_agent_prisma } from "../../features/prisma/internal/prepare_agent_prisma";
import { TestHistory } from "../../internal/TestHistory";
import { TestLogger } from "../../internal/TestLogger";
import { TestProject } from "../../structures/TestProject";

export const archive_prisma = async (
  factory: TestFactory,
  project: TestProject,
) => {
  if (TestGlobal.env.OPENAI_API_KEY === undefined) return false;

  const { agent, zero } = await prepare_agent_prisma(factory, project);
  const start: Date = new Date();
  const model: string = TestGlobal.vendorModel;
  const snapshots: AutoBeEventSnapshot[] = [];
  const listen = (event: AutoBeEventOfSerializable) => {
    if (TestGlobal.archive) TestLogger.event(start, event);
    snapshots.push({
      event,
      tokenUsage: agent.getTokenUsage().toJSON(),
    });
  };
  for (const type of typia.misc.literals<AutoBeEventOfSerializable.Type>())
    agent.on(type, listen);

  let startEvent: AutoBePrismaStartEvent | null = null;
  let components: AutoBePrismaComponentsEvent | null = null;
  agent.on("prismaStart", (event) => {
    startEvent = event;
  });
  agent.on("prismaComponents", (event) => {
    components = event;
  });

  const schemas: AutoBePrismaSchemasEvent[] = [];
  const insufficients: AutoBePrismaInsufficientEvent[] = [];
  agent.on("prismaSchemas", (event) => {
    schemas.push(event);
  });
  agent.on("prismaInsufficient", (event) => {
    insufficients.push(event);
  });

  const validates: AutoBePrismaValidateEvent[] = [];
  agent.on("prismaCorrect", async (event) => {
    await FileSystemIterator.save({
      root: `${TestGlobal.ROOT}/results/${model}/${project}/prisma-correct-${validates.length}`,
      files: Object.fromEntries([
        ["errors.json", JSON.stringify(event.failure.errors)],
        ["correction.json", JSON.stringify(event.correction)],
        ["planning.md", event.planning],
      ]),
    });
  });
  agent.on("prismaValidate", async (event) => {
    validates.push(event);
    await FileSystemIterator.save({
      root: `${TestGlobal.ROOT}/results/${model}/${project}/prisma-failure-${validates.length}`,
      files: {
        "errors.json": JSON.stringify(event.result.errors),
        ...event.schemas,
      },
    });
  });

  let history: AutoBePrismaHistory | AutoBeAssistantMessageHistory =
    await orchestrate.prisma(agent.getContext(), {
      reason:
        "Step to the Prisma DB schema generation after requirements analysis",
    });
  if (history.type !== "prisma") {
    history = await orchestrate.prisma(agent.getContext(), {
      reason: "Don't ask me to do that, and just do it right now.",
    });
    if (history.type !== "prisma")
      throw new Error("History type must be prisma.");
  }
  if (history.compiled.type !== "success") {
    await FileSystemIterator.save({
      root: `${TestGlobal.ROOT}/results/${model}/${project}/prisma-error`,
      files: {
        "result.json": JSON.stringify(history.result),
        ...history.schemas,
        ...(history.compiled.type === "failure"
          ? {
              "reason.log": history.compiled.reason,
            }
          : {
              "error.json": JSON.stringify(history.compiled.error),
            }),
      },
    });
    throw new Error("Prisma validation failed.");
  }

  // REPORT RESULT
  try {
    await FileSystemIterator.save({
      root: `${TestGlobal.ROOT}/results/${model}/${project}/prisma`,
      files: {
        ...(await agent.getFiles()),
        "logs/validates.json": JSON.stringify(validates),
        "logs/result.json": JSON.stringify(history),
        "logs/files.json": JSON.stringify(Object.keys(agent.getFiles())),
        "logs/result-files.json": JSON.stringify(
          Object.keys({
            ...history.compiled.nodeModules,
            ...history.compiled.schemas,
          }),
        ),
        "logs/tokenUsage.json": JSON.stringify(agent.getTokenUsage()),
        "logs/components.json": JSON.stringify(components),
        "logs/schemas.json": JSON.stringify(schemas),
        "logs/start.json": JSON.stringify(startEvent),
      },
    });
  } catch {}
  if (TestGlobal.archive)
    await TestHistory.save({
      [`${project}.prisma.json`]: JSON.stringify(agent.getHistories()),
      [`${project}.prisma.snapshots.json`]: JSON.stringify(
        snapshots.map((s) => ({
          event: s.event,
          tokenUsage: new AutoBeTokenUsage(s.tokenUsage)
            .increment(zero)
            .toJSON(),
        })),
      ),
    });
};
