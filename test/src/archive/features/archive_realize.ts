import { AutoBeTokenUsage } from "@autobe/agent";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeEventOfSerializable,
  AutoBeEventSnapshot,
  AutoBeHistory,
  AutoBeRealizeHistory,
  AutoBeUserMessageContent,
  AutoBeUserMessageHistory,
} from "@autobe/interface";
import { AutoBeExampleProject } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import { TestFactory } from "../../TestFactory";
import { TestGlobal } from "../../TestGlobal";
import { prepare_agent_realize } from "../../features/realize/internal/prepare_agent_realize";
import { ArchiveLogger } from "../utils/ArchiveLogger";

export const archive_realize = async (props: {
  factory: TestFactory;
  vendor: string;
  project: AutoBeExampleProject;
}) => {
  if (TestGlobal.env.OPENAI_API_KEY === undefined) return false;

  // PREPARE AGENT
  const { agent, zero } = await prepare_agent_realize(props);
  const start: Date = new Date();
  const snapshots: AutoBeEventSnapshot[] = [];
  const listen = (event: AutoBeEventOfSerializable) => {
    if (TestGlobal.archive) ArchiveLogger.event(start, event);
    snapshots.push({
      event,
      tokenUsage: agent.getTokenUsage().toJSON(),
    });
  };
  for (const type of typia.misc.literals<AutoBeEventOfSerializable.Type>())
    agent.on(type, listen);

  const userMessage: AutoBeUserMessageHistory =
    await AutoBeExampleStorage.getUserMessage({
      project: props.project,
      phase: "realize",
    });
  const go = (
    c: string | AutoBeUserMessageContent | AutoBeUserMessageContent[],
  ) => agent.conversate(c);

  try {
    // DO REALIZE GENERATION
    let histories: AutoBeHistory[] = await go(userMessage.contents);
    if (histories.every((h) => h.type !== "realize")) {
      histories = await go(
        "Don't ask me to do that, and just do it right now.",
      );
      if (histories.every((h) => h.type !== "realize"))
        throw new Error("History type must be realize.");
    }
    const result: AutoBeRealizeHistory = histories.find(
      (h) => h.type === "realize",
    )!;

    // REPORT RESULT
    try {
      await FileSystemIterator.save({
        root: `${TestGlobal.ROOT}/results/${AutoBeExampleStorage.slugModel(props.vendor, false)}/${props.project}/realize`,
        files: {
          ...(await agent.getFiles()),
          "pnpm-workspace.yaml": "",
          "autobe/instruction.md": result.instruction,
        },
      });
    } catch {}
    await AutoBeExampleStorage.save({
      vendor: props.vendor,
      project: props.project,
      files: {
        [`realize.histories.json`]: JSON.stringify(agent.getHistories()),
        [`realize.snapshots.json`]: JSON.stringify(
          snapshots.map((s) => ({
            event: s.event,
            tokenUsage: new AutoBeTokenUsage(s.tokenUsage)
              .increment(zero)
              .toJSON(),
          })),
        ),
      },
    });
    if (result.compiled.type === "failure")
      console.log(result.compiled.diagnostics);
    TestValidator.equals("result", result.compiled.type, "success");
  } catch (error) {
    await AutoBeExampleStorage.save({
      vendor: props.vendor,
      project: props.project,
      files: {
        [`realize.snapshots.json`]: JSON.stringify(
          snapshots.map((s) => ({
            event: s.event,
            tokenUsage: new AutoBeTokenUsage(s.tokenUsage)
              .increment(zero)
              .toJSON(),
          })),
        ),
      },
    });
    throw error;
  }
};
