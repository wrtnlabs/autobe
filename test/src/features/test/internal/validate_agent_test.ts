import { orchestrate } from "@autobe/agent";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBeEvent } from "@autobe/interface";

import { TestGlobal } from "../../../TestGlobal";
import { prepare_agent_test_main } from "./prepare_agent_test_main";

export const validate_agent_test = async (owner: string, project: string) => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined) return false;

  const { agent } = await prepare_agent_test_main(owner, project);

  const events: AutoBeEvent[] = [];
  agent.on("testStart", (event) => {
    events.push(event);
  });

  agent.on("testScenario", (event) => {
    events.push(event);
  });

  agent.on("testWrite", async (event) => {
    events.push(event);
  });

  agent.on("testValidate", async (event) => {
    events.push(event);
  });

  agent.on("testCorrect", async (event) => {
    events.push(event);
  });

  agent.on("testComplete", (event) => {
    events.push(event);
  });

  const result = await orchestrate.test(agent.getContext())({
    reason: "Step to the test generation referencing the interface",
  });

  if (result.type !== "test") {
    throw new Error("Failed to generate test.");
  }
  if (result.compiled.type !== "success") {
    await FileSystemIterator.save({
      root: `${TestGlobal.ROOT}/results/${owner}/${project}/test-error`,
      files: {
        "result.json": JSON.stringify(result, null, 2),
        ...result.files
          .map((f) => ({ [f.location]: f.content }))
          .reduce((acc, cur) => Object.assign(acc, cur), {}),
        ...(result.compiled.type === "failure"
          ? {
              "reason.log": result.reason,
              "diagnostics.json": JSON.stringify(
                result.compiled.diagnostics,
                null,
                2,
              ),
            }
          : {
              "error.json": JSON.stringify(result.compiled.error, null, 2),
            }),
      },
    });
    throw new Error("Failed to compile test code.");
  }

  // REPORT RESULT
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${owner}/${project}/test/main`,
    files: {
      ...(await agent.getFiles()),
      "logs/history.json": JSON.stringify(agent.getHistories(), null, 2),
      "logs/result.json": JSON.stringify(result, null, 2),
      "logs/tokenUsage.json": JSON.stringify(agent.getTokenUsage(), null, 2),
      "logs/files.json": JSON.stringify(Object.keys(agent.getFiles()), null, 2),
      "logs/events.json": JSON.stringify(events, null, 2),
    },
  });
};
