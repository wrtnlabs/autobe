import { orchestrateRealize } from "@autobe/agent/src/orchestrate/realize/orchestrateRealize";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeAssistantMessageHistory,
  AutoBeEvent,
  AutoBeRealizeHistory,
} from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { TestProject } from "../../../structures/TestProject";
import { prepare_agent_realize_planner } from "./prepare_agent_realize_planner";

export const validate_agent_realize_planner = async (
  factory: TestFactory,
  project: TestProject,
) => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined) return false;

  // PREPARE AGENT
  const { agent } = await prepare_agent_realize_planner(factory, project);

  const map = new Map<string, true>();
  const events: AutoBeEvent[] = [];
  const enroll = (event: AutoBeEvent) => {
    if (!map.has(event.type)) {
      map.set(event.type, true);
      console.log(event.type);
    }

    events.push(event);
  };

  agent.on("realizeStart", enroll);
  agent.on("realizeProgress", enroll);
  agent.on("realizeValidate", enroll);
  agent.on("realizeComplete", enroll);

  // DO TEST GENERATION
  const go = (reason: string) =>
    orchestrateRealize(agent.getContext())({
      reason,
    });
  let result: AutoBeAssistantMessageHistory | AutoBeRealizeHistory = await go(
    "Validate agent realize",
  );
  if (result.type !== "realize") {
    result = await go("Don't ask me to do that, and just do it right now.");
    if (result.type !== "realize")
      throw new Error("Failed to generate realize.");
  }

  const histories = agent.getHistories();

  // REPORT RESULT
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${project}/realize/main`,
    files: {
      ...(await agent.getFiles()),
      "logs/events.json": typia.json.stringify(events),
      "logs/result.json": typia.json.stringify(result),
      "logs/histories.json": typia.json.stringify(histories),
    },
  });
  TestValidator.equals("result")(result.compiled.type)("success");
};
