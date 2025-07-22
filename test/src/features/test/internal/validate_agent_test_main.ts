import { orchestrateTest } from "@autobe/agent/src/orchestrate/test/orchestrateTest";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeAssistantMessageHistory,
  AutoBeEvent,
  AutoBeEventSnapshot,
  AutoBeTestHistory,
} from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import fs from "fs";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { TestProject } from "../../../structures/TestProject";
import { prepare_agent_test } from "./prepare_agent_test";

export const validate_agent_test_main = async (
  factory: TestFactory,
  project: TestProject,
) => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined) return false;

  // PREPARE AGENT
  const { agent } = await prepare_agent_test(factory, project);
  const snapshots: AutoBeEventSnapshot[] = [];
  const enroll = (event: AutoBeEvent) => {
    snapshots.push({
      event,
      tokenUsage: agent.getTokenUsage().toJSON(),
    });
  };
  agent.on("testStart", enroll);
  agent.on("testScenario", enroll);
  agent.on("testWrite", enroll);
  agent.on("testValidate", enroll);
  agent.on("testCorrect", enroll);
  agent.on("testComplete", enroll);

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

  const histories = agent.getHistories();

  // REPORT RESULT
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${project}/test/main`,
    files: {
      ...(await agent.getFiles()),
      "logs/compiled.json": JSON.stringify(result.compiled),
      "logs/snapshots.json": JSON.stringify(snapshots),
      "logs/result.json": JSON.stringify({
        ...result,
        files: undefined,
      }),
      "logs/histories.json": JSON.stringify(histories),
      "pnpm-workspace.yaml": "",
    },
  });
  TestValidator.equals("result")(result.compiled.type)("success");
  if (process.argv.includes("--archive")) {
    await fs.promises.writeFile(
      `${TestGlobal.ROOT}/assets/histories/${project}.test.json`,
      JSON.stringify(agent.getHistories()),
      "utf8",
    );
    await fs.promises.writeFile(
      `${TestGlobal.ROOT}/assets/histories/${project}.test.snapshots.json`,
      JSON.stringify(snapshots),
      "utf8",
    );
  }
};
