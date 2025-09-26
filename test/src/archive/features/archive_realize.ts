import { AutoBeTokenUsage } from "@autobe/agent";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeEventOfSerializable,
  AutoBeEventSnapshot,
  AutoBeHistory,
  AutoBeRealizeHistory,
  AutoBeUserMessageContent,
  AutoBeUserMessageHistory,
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
  if (TestGlobal.env.OPENAI_API_KEY === undefined) return false;

  // PREPARE AGENT
  const { agent, zero } = await prepare_agent_realize(factory, project);
  const start: Date = new Date();
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

  const userMessage: AutoBeUserMessageHistory =
    await TestHistory.getUserMessage(project, "realize");
  const go = (
    c: string | AutoBeUserMessageContent | AutoBeUserMessageContent[],
  ) => agent.conversate(c);

  // DO REALIZE GENERATION
  let histories: AutoBeHistory[] = await go(userMessage.contents);
  if (histories.every((h) => h.type !== "realize")) {
    histories = await go("Don't ask me to do that, and just do it right now.");
    if (histories.every((h) => h.type !== "realize"))
      throw new Error("History type must be realize.");
  }
  const result: AutoBeRealizeHistory = histories.find(
    (h) => h.type === "realize",
  )!;

  // REPORT RESULT
  const model: string = TestGlobal.vendorModel;
  try {
    await FileSystemIterator.save({
      root: `${TestGlobal.ROOT}/results/${model}/${project}/realize`,
      files: {
        ...(await agent.getFiles()),
        "pnpm-workspace.yaml": "",
      },
    });
  } catch {}
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
  if (result.compiled.type === "failure")
    console.log(result.compiled.diagnostics);
  TestValidator.equals("result", result.compiled.type, "success");
};
