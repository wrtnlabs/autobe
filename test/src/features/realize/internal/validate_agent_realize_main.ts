import { orchestrateRealize } from "@autobe/agent/src/orchestrate/realize/orchestrateRealize";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeAssistantMessageHistory,
  AutoBeEvent,
  AutoBeEventSnapshot,
  AutoBeRealizeHistory,
} from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { TestHistory } from "../../../internal/TestHistory";
import { TestProject } from "../../../structures/TestProject";
import { prepare_agent_realize } from "./prepare_agent_realize";

export const validate_agent_realize_main = async (
  factory: TestFactory,
  project: TestProject,
) => {
  if (TestGlobal.env.API_KEY === undefined) return false;

  // PREPARE AGENT
  const { agent } = await prepare_agent_realize(factory, project);
  const snapshots: AutoBeEventSnapshot[] = [];
  const enroll = (event: AutoBeEvent) => {
    snapshots.push({
      event,
      tokenUsage: agent.getTokenUsage().toJSON(),
    });

    if (event.type === "realizeWrite" || event.type === "realizeCorrect") {
      console.log(
        event.filename,
        `${event.completed}/${event.total} completed.`,
      );
    }
  };

  agent.on("realizeStart", enroll);
  agent.on("realizeWrite", enroll);
  agent.on("realizeCorrect", enroll);
  agent.on("realizeValidate", enroll);
  agent.on("realizeComplete", enroll);

  agent.on("realizeAuthorizationStart", enroll);
  agent.on("realizeAuthorizationWrite", enroll);
  agent.on("realizeAuthorizationValidate", enroll);
  agent.on("realizeAuthorizationCorrect", enroll);
  agent.on("realizeAuthorizationComplete", enroll);

  agent.on("realizeTestStart", enroll);
  agent.on("realizeTestReset", enroll);
  agent.on("realizeTestOperation", enroll);
  agent.on("realizeTestComplete", enroll);

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

  // REPORT RESULT
  const model: string = TestGlobal.getVendorModel();
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${model}/${project}/realize/main`,
    files: {
      ...(await agent.getFiles()),
      "pnpm-workspace.yaml": "",
    },
  });
  if (process.argv.includes("--archive"))
    await TestHistory.save({
      [`${project}.realize.json`]: JSON.stringify(agent.getHistories()),
      [`${project}.realize.snapshots.json`]: JSON.stringify(snapshots),
    });
  TestValidator.equals("result")(result.compiled.type)("success");
};
