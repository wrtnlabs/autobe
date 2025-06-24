import { orchestrateTestCorrect } from "@autobe/agent/src/orchestrate/test/orchestrateTestCorrect";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeEvent,
  AutoBeTestScenario,
  AutoBeTestWriteEvent,
} from "@autobe/interface";
import fs from "fs";

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
  agent.on("testValidate", (event) => {
    events.push(event);
  });

  const scenarios: AutoBeTestScenario[] = JSON.parse(
    await fs.promises.readFile(
      `${ROOT}/assets/repositories/${owner}/${project}/test/scenarios.json`,
      "utf8",
    ),
  );

  const writes: AutoBeTestWriteEvent[] = JSON.parse(
    await fs.promises.readFile(
      `${ROOT}/assets/repositories/${owner}/${project}/test/codes.json`,
      "utf8",
    ),
  );

  const correct = await orchestrateTestCorrect(
    agent.getContext(),
    writes,
    scenarios,
  );

  const files = correct.files
    .map((file) => {
      return { [`compiled/${file.location}`]: file.content };
    })
    .reduce<Record<string, string>>((acc, cur) => {
      return Object.assign(acc, cur);
    }, {});

  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${owner}/${project}/test/correct`,
    files: {
      ...files,
      "logs/history.json": JSON.stringify(agent.getHistories(), null, 2),
      "logs/writes.json": JSON.stringify(writes, null, 2),
      "logs/correct.json": JSON.stringify(correct, null, 2),
      "logs/tokenUsage.json": JSON.stringify(agent.getTokenUsage(), null, 2),
      "logs/files.json": JSON.stringify(Object.keys(agent.getFiles()), null, 2),
      "logs/events.json": JSON.stringify(events, null, 2),
      "logs/compiled.json": JSON.stringify(correct.files, null, 2),
    },
  });

  return correct;
};
