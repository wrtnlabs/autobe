import { orchestrateRealize } from "@autobe/agent/src/orchestrate/realize/orchestrateRealize";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeAssistantMessageHistory,
  AutoBeEvent,
  AutoBeRealizeHistory,
} from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import fs from "fs";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { TestProject } from "../../../structures/TestProject";
import { prepare_agent_realize } from "./prepare_agent_realize";

export const validate_agent_realize_main = async (
  factory: TestFactory,
  project: TestProject,
) => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined) return false;

  // PREPARE AGENT
  const { agent } = await prepare_agent_realize(factory, project);

  const events: AutoBeEvent[] = [];
  const enroll = (event: AutoBeEvent) => {
    events.push(event);
  };

  agent.on("realizeStart", enroll);
  agent.on("realizeProgress", enroll);
  agent.on("realizeValidate", enroll);
  agent.on("realizeComplete", enroll);

  agent.on("realizeAuthorizationStart", enroll);
  agent.on("realizeAuthorizationWrite", enroll);
  agent.on("realizeAuthorizationValidate", enroll);
  agent.on("realizeAuthorizationCorrect", enroll);
  agent.on("realizeAuthorizationComplete", enroll);

  const ctx = agent.getContext();

  // DO TEST GENERATION
  const go = (reason: string) =>
    orchestrateRealize(ctx)({
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

  // const histories = agent.getHistories();

  // REPORT RESULT
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${project}/realize/main`,
    files: {
      ...(await agent.getFiles()),
      // "logs/events.json": JSON.stringify(events),
      // "logs/result.json": JSON.stringify(result),
      // "logs/histories.json": JSON.stringify(histories),
    },
  });
  TestValidator.equals("result")(result.compiled.type)("success");

  if (process.argv.includes("--archive"))
    await fs.promises.writeFile(
      `${TestGlobal.ROOT}/assets/histories/${project}.realize.json`,
      JSON.stringify(agent.getHistories()),
      "utf8",
    );
};
