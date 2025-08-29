import { AutoBeTokenUsage } from "@autobe/agent";
import { orchestrateRealize } from "@autobe/agent/src/orchestrate/realize/orchestrateRealize";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeAssistantMessageHistory,
  AutoBeEvent,
  AutoBeEventSnapshot,
  AutoBeRealizeHistory,
} from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import { TestFactory } from "../../TestFactory";
import { TestGlobal } from "../../TestGlobal";
import { prepare_agent_realize } from "../../features/realize/internal/prepare_agent_realize";
import { TestHistory } from "../../internal/TestHistory";
import { TestLogger } from "../../internal/TestLogger";
import { TestProject } from "../../structures/TestProject";

export const archive_realize = async (
  factory: TestFactory,
  project: TestProject,
) => {
  if (TestGlobal.env.API_KEY === undefined) return false;

  // PREPARE AGENT
  const { agent, zero } = await prepare_agent_realize(factory, project);
  const start: Date = new Date();
  const snapshots: AutoBeEventSnapshot[] = [];
  const listen = (event: AutoBeEvent) => {
    if (TestGlobal.archive) TestLogger.event(start, event);
    snapshots.push({
      event,
      tokenUsage: agent.getTokenUsage().toJSON(),
    });
  };

  agent.on("assistantMessage", listen);
  agent.on("jsonParseError", listen);
  agent.on("jsonValidateError", listen);
  for (const type of typia.misc.literals<AutoBeEvent.Type>())
    if (type.startsWith("realize")) agent.on(type, listen);

  // DO TEST GENERATION
  const ctx = agent.getContext();
  const result: AutoBeAssistantMessageHistory | AutoBeRealizeHistory =
    await orchestrateRealize(ctx)({
      reason: "Validate agent realize",
    });
  if (result.type !== "realize") throw new Error("Failed to generate realize.");

  const filterTsFiles = (location: string) => location.endsWith(".ts");

  const templateFiles = await (await ctx.compiler()).realize.getTemplate();
  // REPORT RESULT
  const model: string = TestGlobal.getVendorModel();
  const prisma = ctx.state().prisma?.compiled;

  const payloads = Object.fromEntries(
    result.authorizations.map((authorization) => [
      authorization.payload.location,
      authorization.payload.content,
    ]),
  );

  const nodeModules = prisma?.type === "success" ? prisma.nodeModules : {};
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${model}/${project}/realize/main`,
    files: {
      ...nodeModules,
      ...payloads,
      ...(await agent.getFiles()),
      ...Object.fromEntries(
        Object.entries(templateFiles).filter(([key]) => filterTsFiles(key)),
      ),
      "pnpm-workspace.yaml": "",
    },
  });
  if (TestGlobal.archive)
    await TestHistory.save({
      [`${project}.realize.json`]: JSON.stringify(agent.getHistories()),
      [`${project}.realize.snapshots.json`]: JSON.stringify(
        snapshots.map((s) => ({
          event: s.event,
          tokenUsage: new AutoBeTokenUsage(s.tokenUsage)
            .increment(zero)
            .toJSON(),
        })),
      ),
    });

  TestValidator.equals("result", result.compiled.type, "success");
};
