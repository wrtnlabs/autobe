import { orchestrateTestWrite } from "@autobe/agent/src/orchestrate/test/orchestrateTestWrite";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeTestScenario,
  AutoBeTestWriteEvent,
  IAutoBeTypeScriptCompilerResult,
} from "@autobe/interface";
import fs from "fs";
import typia from "typia";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { TestProject } from "../../../structures/TestProject";
import { prepare_agent_test } from "./prepare_agent_test";

export const validate_agent_test_write = async (
  factory: TestFactory,
  project: TestProject,
) => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined) return false;

  // PREPARE ASSETS
  const { agent } = await prepare_agent_test(factory, project);
  const scenarios: AutoBeTestScenario[] = JSON.parse(
    await fs.promises.readFile(
      `${TestGlobal.ROOT}/assets/histories/${project}.test.scenarios.json`,
      "utf8",
    ),
  );
  typia.assert(scenarios);

  // GENERATE TEST FUNCTIONS
  const writes: AutoBeTestWriteEvent[] = await orchestrateTestWrite(
    agent.getContext(),
    scenarios,
  );
  typia.assert(writes);

  // REPORT RESULT
  const files: Record<string, string> = await agent.getFiles();
  const compiled: IAutoBeTypeScriptCompilerResult = await agent
    .getContext()
    .compiler.typescript.compile({
      files: Object.fromEntries(
        Object.entries(files).filter(
          ([key]) =>
            (key.startsWith("src/") || key.startsWith("test/")) &&
            key.endsWith(".ts"),
        ),
      ),
    });
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${project}/test/write`,
    files: {
      ...files,
      "logs/writes.json": JSON.stringify(writes, null, 2),
      "logs/compiled.json": JSON.stringify(compiled, null, 2),
    },
  });
  return writes;
};
