import { orchestrateTestWrite } from "@autobe/agent/src/orchestrate/test/orchestrateTestWrite";
import { IAutoBeTestWriteResult } from "@autobe/agent/src/orchestrate/test/structures/IAutoBeTestWriteResult";
import { AutoBeCompilerTemplate } from "@autobe/compiler/src/raw/AutoBeCompilerTemplate";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeTestScenario,
  IAutoBeTypeScriptCompileResult,
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
  const writes: IAutoBeTestWriteResult[] = await orchestrateTestWrite(
    agent.getContext(),
    scenarios,
  );
  typia.assert(writes);

  // REPORT RESULT
  const files: Record<string, string> = Object.fromEntries([
    ...Object.entries(await agent.getFiles()).filter(
      ([key]) => key.startsWith("test") === false,
    ),
    ...writes
      .map((w) => [
        [w.event.location.replace(".ts", ".scenario"), w.event.scenario],
        [w.event.location.replace(".ts", ".draft"), w.event.draft],
        [w.event.location.replace(".ts", ".review"), w.event.review],
        [w.event.location, w.event.final],
      ])
      .flat(),
  ]);
  const compiled: IAutoBeTypeScriptCompileResult = await agent
    .getContext()
    .compiler.typescript.compile({
      files: Object.fromEntries(
        Object.entries(files).filter(
          ([key]) =>
            (key.startsWith("src/api") || key.startsWith("test/")) &&
            key.endsWith(".ts") &&
            key.endsWith(".draft.ts") === false,
        ),
      ),
    });
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${project}/test/write`,
    files: {
      ...files,
      "test/tsconfig.json": AutoBeCompilerTemplate["test/tsconfig.json"],
      "logs/results.json": typia.json.stringify(writes),
      "logs/compiled.json": JSON.stringify(
        {
          ...compiled,
          javascript: undefined,
        },
        null,
        2,
      ),
    },
  });
  if (process.argv.includes("--archive"))
    await fs.promises.writeFile(
      `${TestGlobal.ROOT}/assets/histories/${project}.test.writes.json`,
      JSON.stringify(writes, null, 2),
    );
};
