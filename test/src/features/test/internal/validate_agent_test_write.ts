import { orchestrateTestOperationWrite } from "@autobe/agent/src/orchestrate/test/orchestrateTestOperationWrite";
import { IAutoBeTestOperationWriteResult } from "@autobe/agent/src/orchestrate/test/structures/IAutoBeTestOperationWriteResult";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { AutoBeCompilerInterfaceTemplate } from "@autobe/compiler/src/raw/AutoBeCompilerInterfaceTemplate";
import { CompressUtil, FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeEventOfSerializable,
  AutoBeTestScenario,
  IAutoBeCompiler,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { AutoBeExampleProject } from "@autobe/interface";
import fs from "fs";
import typia from "typia";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { ArchiveLogger } from "../../../archive/utils/ArchiveLogger";
import { prepare_agent_test } from "./prepare_agent_test";

export const validate_agent_test_write = async (props: {
  factory: TestFactory;
  vendor: string;
  project: AutoBeExampleProject;
}) => {
  if (TestGlobal.env.OPENAI_API_KEY === undefined) return false;

  // PREPARE ASSETS
  const { agent } = await prepare_agent_test(props);
  const scenarios: AutoBeTestScenario[] = JSON.parse(
    await CompressUtil.gunzip(
      await fs.promises.readFile(
        `${AutoBeExampleStorage.getDirectory({
          vendor: props.vendor,
          project: props.project,
        })}/test.scenarios.json.gz`,
      ),
    ),
  );

  const start: Date = new Date();
  for (const type of typia.misc.literals<AutoBeEventOfSerializable.Type>())
    agent.on(type, (event) => ArchiveLogger.event(start, event));
  agent.on("vendorResponse", (e) => ArchiveLogger.event(start, e));

  // GENERATE TEST FUNCTIONS
  const writes: IAutoBeTestOperationWriteResult[] =
    await orchestrateTestOperationWrite(agent.getContext(), {
      instruction: "Generate diverse and comprehensive test scenarios.",
      scenarios,
      events: [], // TODO: fill up with mock events later.
    });

  // REPORT RESULT
  const compiler: IAutoBeCompiler = await agent.getContext().compiler();
  const files: Record<string, string> = Object.fromEntries([
    ...Object.entries(await agent.getFiles()).filter(
      ([key]) => key.startsWith("test") === false,
    ),
    ...writes
      .map((w) => [
        [w.function.location.replace(".ts", ".scenario"), w.function.scenario],
        [w.function.location, w.function.content],
      ])
      .flat(),
  ]);
  const result: IAutoBeTypeScriptCompileResult =
    await compiler.typescript.compile({
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
    root: `${TestGlobal.ROOT}/results/${props.vendor}/${props.project}/test/write`,
    files: {
      ...files,
      "test/tsconfig.json":
        AutoBeCompilerInterfaceTemplate["test/tsconfig.json"],
      "logs/results.json": JSON.stringify(writes),
      "logs/compiled.json": JSON.stringify(result),
    },
  });
  if (TestGlobal.archive)
    await AutoBeExampleStorage.save({
      vendor: props.vendor,
      project: props.project,
      files: {
        [`test.writes.json`]: JSON.stringify(writes),
      },
    });
};
