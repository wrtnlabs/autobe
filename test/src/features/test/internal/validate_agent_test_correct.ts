import { orchestrateTestCorrect } from "@autobe/agent/src/orchestrate/test/orchestrateTestCorrect";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBeEvent, AutoBeTestProgressEvent } from "@autobe/interface";
import fs from "fs";
import typia from "typia";

import { TestGlobal } from "../../../TestGlobal";
import { prepare_agent_test } from "./prepare_agent_test";

const ROOT = `${__dirname}/../../../..`;

export const validate_agent_test_correct = async (
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

  const codes: AutoBeTestProgressEvent[] = JSON.parse(
    await fs.promises.readFile(
      `${ROOT}/assets/repositories/${owner}/${project}/test/codes.json`,
      "utf8",
    ),
  );

  const correct = await orchestrateTestCorrect(agent.getContext(), codes);

  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${owner}/${project}/test/plan`,
    files: {
      "logs/history.json": JSON.stringify(agent.getHistories(), null, 2),
      "logs/codes.json": JSON.stringify(codes, null, 2),
      "logs/tokenUsage.json": JSON.stringify(agent.getTokenUsage(), null, 2),
      "logs/files.json": JSON.stringify(Object.keys(agent.getFiles()), null, 2),
      "logs/events.json": JSON.stringify(events, null, 2),
      "logs/compiled.json": JSON.stringify(correct.files, null, 2),
      "logs/correct": JSON.stringify(correct, null, 2),
    },
  });

  typia.assertEquals(correct);
  return correct;
};
