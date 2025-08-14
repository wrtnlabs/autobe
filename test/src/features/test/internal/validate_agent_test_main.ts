import { AutoBeTokenUsage } from "@autobe/agent";
import { orchestrateTest } from "@autobe/agent/src/orchestrate/test/orchestrateTest";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeAssistantMessageHistory,
  AutoBeEvent,
  AutoBeEventSnapshot,
  AutoBeHistory,
  AutoBeTestHistory,
} from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { TestHistory } from "../../../internal/TestHistory";
import { TestLogger } from "../../../internal/TestLogger";
import { TestProject } from "../../../structures/TestProject";
import { prepare_agent_test } from "./prepare_agent_test";

export const validate_agent_test_main = async (
  factory: TestFactory,
  project: TestProject,
) => {
  if (TestGlobal.env.API_KEY === undefined) return false;

  // PREPARE AGENT
  const { agent, zero } = await prepare_agent_test(factory, project);
  const snapshots: AutoBeEventSnapshot[] = [];
  const start: Date = new Date();
  const listen = (event: AutoBeEvent) => {
    if (TestGlobal.archive) TestLogger.event(start, event);
    snapshots.push({
      event,
      tokenUsage: agent.getTokenUsage().toJSON(),
    });
  };
  agent.on("assistantMessage", listen);
  for (const type of typia.misc.literals<AutoBeEvent.Type>())
    if (type.startsWith("test")) agent.on(type, listen);

  // DO TEST GENERATION
  const go = (reason: string) =>
    orchestrateTest(agent.getContext())({
      reason,
    });
  let result: AutoBeAssistantMessageHistory | AutoBeTestHistory = await go(
    "Validate agent test",
  );
  if (result.type !== "test") {
    result = await go("Don't ask me to do that, and just do it right now.");
    if (result.type !== "test") throw new Error("Failed to generate test.");
  }

  // REPORT RESULT
  const histories: AutoBeHistory[] = agent.getHistories();
  const model: string = TestGlobal.getVendorModel();
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${model}/${project}/test/main`,
    files: {
      ...(await agent.getFiles()),
      "pnpm-workspace.yaml": "",
      "logs/compiled.json": JSON.stringify(result.compiled),
      "logs/snapshots.json": JSON.stringify(snapshots),
      "logs/result.json": JSON.stringify({
        ...result,
        files: undefined,
      }),
      "logs/histories.json": JSON.stringify(histories),
    },
  });
  if (process.argv.includes("--archive"))
    await TestHistory.save({
      [`${project}.test.json`]: JSON.stringify(histories),
      [`${project}.test.snapshots.json`]: JSON.stringify(
        snapshots.map((s) => ({
          event: s.event,
          tokenUsage: new AutoBeTokenUsage(s.tokenUsage)
            .increment(zero)
            .toJSON(),
        })),
      ),
    });
  TestValidator.equals("result")(result.compiled.type)("success");
};
