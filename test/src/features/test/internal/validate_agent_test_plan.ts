import { orchestrateTestPlan } from "@autobe/agent/src/orchestrate/test/orchestrateTestPlan";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBeEvent } from "@autobe/interface";
import typia from "typia";

import { TestGlobal } from "../../../TestGlobal";
import { prepare_agent_test } from "./prepare_agent_test";

export const validate_agent_test_plan = async (
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

  const result = await orchestrateTestPlan(agent.getContext());
  typia.assert(result);

  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${owner}/${project}/test/plan`,
    files: {
      "plans.json": JSON.stringify(result.plans, null, 2),
      "logs/history.json": JSON.stringify(agent.getHistories(), null, 2),
      "logs/result.json": JSON.stringify(result, null, 2),
      "logs/tokenUsage.json": JSON.stringify(agent.getTokenUsage(), null, 2),
      "logs/files.json": JSON.stringify(Object.keys(agent.getFiles()), null, 2),
      "logs/events.json": JSON.stringify(events, null, 2),
    },
  });

  return result;
};
