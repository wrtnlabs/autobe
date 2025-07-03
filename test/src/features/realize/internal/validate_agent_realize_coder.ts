import {
  FAILED,
  pipe,
} from "@autobe/agent/src/orchestrate/realize/orchestrateRealize";
import { orchestrateRealizeCoder } from "@autobe/agent/src/orchestrate/realize/orchestrateRealizeCoder";
import { orchestrateRealizePlanner } from "@autobe/agent/src/orchestrate/realize/orchestrateRealizePlanner";
import { IAutoBeRealizeCorderApplication } from "@autobe/agent/src/orchestrate/realize/structures/IAutoBeRealizeCorderApplication";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBeEvent } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { TestProject } from "../../../structures/TestProject";
import { prepare_agent_realize } from "./prepare_agent_realize";

export const validate_agent_realize_coder = async (
  factory: TestFactory,
  project: TestProject,
) => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined) return false;

  // PREPARE AGENT
  const { agent } = await prepare_agent_realize(factory, project);

  const map = new Map<string, true>();
  const events: AutoBeEvent[] = [];
  const enroll = (event: AutoBeEvent) => {
    if (!map.has(event.type)) {
      map.set(event.type, true);
    }

    events.push(event);
  };

  agent.on("realizeStart", enroll);
  agent.on("realizeProgress", enroll);
  agent.on("realizeValidate", enroll);
  agent.on("realizeComplete", enroll);

  const ctx = agent.getContext();

  const ops = ctx.state().interface?.document.operations ?? [];

  // DO TEST GENERATION
  const go = async () =>
    await Promise.all(
      ops.map(async (op) =>
        pipe(
          op,
          (op) => orchestrateRealizePlanner(ctx, op),
          (c) => orchestrateRealizeCoder(ctx, c),
        ),
      ),
    );

  const result: (
    | IAutoBeRealizeCorderApplication.RealizeCoderOutput
    | FAILED
  )[] = await go();

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
  TestValidator.predicate("result")(result.every((el) => el !== FAILED));
};
