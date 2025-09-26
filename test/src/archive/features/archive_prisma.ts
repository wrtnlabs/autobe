import { AutoBeTokenUsage } from "@autobe/agent";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeEventOfSerializable,
  AutoBeEventSnapshot,
  AutoBeHistory,
  AutoBePrismaHistory,
  AutoBePrismaInsufficientEvent,
  AutoBePrismaValidateEvent,
  AutoBeUserMessageContent,
  AutoBeUserMessageHistory,
} from "@autobe/interface";
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

  const userMessage: AutoBeUserMessageHistory =
    await TestHistory.getUserMessage(project, "prisma");
  const go = (
    c: string | AutoBeUserMessageContent | AutoBeUserMessageContent[],
  ) => agent.conversate(c);

  // REQUEST PRISMA GENERATION
  let histories: AutoBeHistory[] = await go(userMessage.contents);
  if (histories.every((h) => h.type !== "prisma")) {
    histories = await go("Don't ask me to do that, and just do it right now.");
    if (histories.every((h) => h.type !== "prisma"))
      throw new Error("History type must be prisma.");
  }

  const prisma: AutoBePrismaHistory = histories.find(
    (h) => h.type === "prisma",
  )!;
  if (prisma.compiled.type !== "success") {
    await FileSystemIterator.save({
      root: `${TestGlobal.ROOT}/results/${model}/${project}/prisma-error`,
      files: {
        "result.json": JSON.stringify(prisma.result),
        ...prisma.schemas,
        ...(prisma.compiled.type === "failure"
          ? {
              "reason.log": prisma.compiled.reason,
            }
          : {
              "error.json": JSON.stringify(prisma.compiled.error),
            }),
      },
    });
    throw new Error("Prisma validation failed.");
  }

  // REPORT RESULT
  try {
    await FileSystemIterator.save({
      root: `${TestGlobal.ROOT}/results/${model}/${project}/prisma`,
      files: await agent.getFiles(),
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
