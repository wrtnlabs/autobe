import { AutoBeTokenUsage } from "@autobe/agent";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeEventOfSerializable,
  AutoBeEventSnapshot,
  AutoBeHistory,
  AutoBeTestHistory,
  AutoBeUserMessageContent,
  AutoBeUserMessageHistory,
} from "@autobe/interface";
import { AutoBeExampleProject } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import { TestFactory } from "../../TestFactory";
import { TestGlobal } from "../../TestGlobal";
import { prepare_agent_test } from "../../features/test/internal/prepare_agent_test";
import { ArchiveLogger } from "../utils/ArchiveLogger";

export let archive_test = async (props: {
  factory: TestFactory;
  vendor: string;
  project: AutoBeExampleProject;
}) => {
  if (TestGlobal.env.OPENAI_API_KEY === undefined) return false;

  // PREPARE AGENT
  let { agent, zero } = await prepare_agent_test(props);
  let snapshots: AutoBeEventSnapshot[] = [];
  let start: Date = new Date();
  let listen = (event: AutoBeEventOfSerializable) => {
    if (TestGlobal.archive) ArchiveLogger.event(start, event);
    snapshots.push({
      event,
      tokenUsage: agent.getTokenUsage().toJSON(),
    });
  };
  for (let type of typia.misc.literals<AutoBeEventOfSerializable.Type>())
    agent.on(type, listen);
  agent.on("vendorTimeout", (e) => ArchiveLogger.event(start, e));

  const userMessage: AutoBeUserMessageHistory =
    await AutoBeExampleStorage.getUserMessage({
      project: props.project,
      phase: "test",
    });
  const go = (
    c: string | AutoBeUserMessageContent | AutoBeUserMessageContent[],
  ) => agent.conversate(c);

  // DO TEST GENERATION
  let histories: AutoBeHistory[] = await go(userMessage.contents);
  if (histories.every((h) => h.type !== "test")) {
    histories = await go("Don't ask me to do that, and just do it right now.");
    if (histories.every((h) => h.type !== "test"))
      throw new Error("History type must be test.");
  }
  const result: AutoBeTestHistory = histories.find((h) => h.type === "test")!;

  // REPORT RESULT
  try {
    await FileSystemIterator.save({
      root: `${TestGlobal.ROOT}/results/${AutoBeExampleStorage.slugModel(props.vendor, false)}/${props.project}/test`,
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
      [`test.histories.json`]: JSON.stringify(agent.getHistories()),
      [`test.snapshots.json`]: JSON.stringify(
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
};
