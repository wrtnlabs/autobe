import { orchestrateTestCorrect } from "@autobe/agent/src/orchestrate/test/orchestrateTestCorrect";
import { IAutoBeTestWriteResult } from "@autobe/agent/src/orchestrate/test/structures/IAutoBeTestWriteResult";
import { AutoBeCompilerInterfaceTemplate } from "@autobe/compiler/src/raw/AutoBeCompilerInterfaceTemplate";
import { CompressUtil, FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeTestCorrectEvent,
  AutoBeTestValidateEvent,
} from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import fs from "fs";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { TestProject } from "../../../structures/TestProject";
import { prepare_agent_test } from "./prepare_agent_test";

export const validate_agent_test_correct = async (
  factory: TestFactory,
  project: TestProject,
) => {
  if (TestGlobal.env.API_KEY === undefined) return false;

  // PREPARE ASSETS
  const { agent } = await prepare_agent_test(factory, project);
  const model: string = TestGlobal.getVendorModel();
  const writes: IAutoBeTestWriteResult[] = JSON.parse(
    await CompressUtil.gunzip(
      await fs.promises.readFile(
        `${TestGlobal.ROOT}/assets/histories/${model}/${project}.test.writes.json.gz`,
      ),
    ),
  );

  // CORRECT TEST FUNCTIONS
  const events: Map<string, AutoBeTestCorrectEvent> = new Map();
  agent.on("testCorrect", (event) => {
    events.set(event.file.location, event);
  });
  const result: AutoBeTestValidateEvent[] = await orchestrateTestCorrect(
    agent.getContext(),
    writes,
  );

  const templateFiles = await (
    await agent.getContext().compiler()
  ).realize.getTemplate();

  // ARCHIVE RESULT
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${model}/${project}/test/correct`,
    files: {
      ...Object.fromEntries([
        ...Object.entries(await agent.getFiles()).filter(
          ([key]) => key.startsWith("test/features") === false,
        ),
        ...result.map((r) => [r.file.location, r.file.content]),
        ...Array.from(events.values())
          .map((e) => [
            [
              e.file.location.replace(".ts", ".scenario"),
              JSON.stringify(e.file.scenario),
            ],
            // [
            //   e.file.location.replace(".ts", ".1.think"),
            //   e.think_without_compile_error,
            // ],
            // [
            //   e.file.location.replace(".ts", ".2.think"),
            //   e.think_again_with_compile_error,
            // ],
            [e.file.location.replace(".ts", ".review"), e.review],
            [e.file.location.replace(".ts", ".draft"), e.draft],
          ])
          .flat(),
      ]),
      ...templateFiles,
      "test/tsconfig.json":
        AutoBeCompilerInterfaceTemplate["test/tsconfig.json"],
      "logs/corrects.json": JSON.stringify(result),
      "logs/failures.json": JSON.stringify(
        result
          .map((c) => c.result)
          .filter((r) => r.type === "failure")
          .map((r) => r.diagnostics)
          .flat(),
      ),
    },
  });
  TestValidator.equals("result")(result.length)(
    result.filter((r) => r.result.type === "success").length,
  );
};
