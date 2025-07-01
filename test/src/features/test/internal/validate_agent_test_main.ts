import { orchestrateTest } from "@autobe/agent/src/orchestrate/test/orchestrateTest";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeAssistantMessageHistory,
  AutoBeEvent,
  AutoBeTestHistory,
} from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

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

  const map = new Map<string, true>();
  const events: AutoBeEvent[] = [];
  const enroll = (event: AutoBeEvent) => {
    if (!map.has(event.type)) {
      map.set(event.type, true);
      console.log(event.type);
    }

    events.push(event);
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

  // REPORT RESULT
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${project}/test/main`,
    files: {
      ...(await agent.getFiles()),
      "logs/events.json": typia.json.stringify(events),
      "logs/result.json": typia.json.stringify(result),
    },
  });
  TestValidator.equals("result")(result.compiled.type)("success");
};
