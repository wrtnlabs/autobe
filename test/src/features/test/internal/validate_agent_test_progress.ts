import { orchestrateTestProgress } from "@autobe/agent/src/orchestrate/test/orchestrateTestProgress";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBeEvent } from "@autobe/interface";
import { IAutoBeTestPlan } from "@autobe/interface/src/test/AutoBeTestPlan";
import fs from "fs";
import typia from "typia";

import { TestGlobal } from "../../../TestGlobal";
import { prepare_agent_test } from "./prepare_agent_test";

const ROOT = `${__dirname}/../../../..`;

export const validate_agent_test_progress = async (
  owner: "samchon" | "kakasoo" | "michael",
  project: "bbs-backend" | "shopping-backend",
) => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined) return false;

  const { agent } = await prepare_agent_test(project);

  const events: AutoBeEvent[] = [];
  agent.on("testStart", (event) => {
    events.push(event);
  });

  agent.on("testPlan", (event) => {
    events.push(event);
  });

  agent.on("testComplete", (event) => {
    events.push(event);
  });

  const plans: IAutoBeTestPlan.IScenario[] = JSON.parse(
    await fs.promises.readFile(
      `${ROOT}/assets/repositories/${owner}/${project}/test/plans.json`,
      "utf8",
    ),
  );

  const codes = await orchestrateTestProgress(agent.getContext(), plans);
  typia.assertEquals(codes);

  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${owner}/${project}/test/progress`,
    files: {
      "logs/history.json": JSON.stringify(agent.getHistories(), null, 2),
      "logs/codes.json": JSON.stringify(codes, null, 2),
      "logs/tokenUsage.json": JSON.stringify(agent.getTokenUsage(), null, 2),
      "logs/files.json": JSON.stringify(Object.keys(agent.getFiles()), null, 2),
      "logs/events.json": JSON.stringify(events, null, 2),
    },
  });

  return codes;
};
