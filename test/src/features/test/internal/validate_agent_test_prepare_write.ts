import { AutoBeAgent } from "@autobe/agent";
import { orchestrateTestCorrect } from "@autobe/agent/src/orchestrate/test/orchestrateTestCorrect";
import { orchestrateTestPrepareWrite } from "@autobe/agent/src/orchestrate/test/orchestrateTestPrepareWrite";
import { IAutoBeTestPrepareWriteResult } from "@autobe/agent/src/orchestrate/test/structures/IAutoBeTestPrepareWriteResult";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeEventOfSerializable,
  AutoBeOpenApi,
  AutoBeTestValidateEvent,
  IAutoBeCompiler,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { AutoBeExampleProject } from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import typia from "typia";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { ArchiveLogger } from "../../../archive/utils/ArchiveLogger";
import { prepare_agent_test } from "./prepare_agent_test";

export const validate_agent_test_prepare_write = async (props: {
  factory: TestFactory;
  vendor: string;
  project: AutoBeExampleProject;
}) => {
  if (TestGlobal.env.OPENAI_API_KEY === undefined) return false;

  // PREPARE ASSETS
  const { agent, interface: interfaceState } = await prepare_agent_test(props);

  // Get operations and document from interface state
  const document: AutoBeOpenApi.IDocument = interfaceState.document;

  const start: Date = new Date();
  for (const type of typia.misc.literals<AutoBeEventOfSerializable.Type>())
    agent.on(type, (event) => ArchiveLogger.event(start, event));
  agent.on("vendorResponse", (e) => ArchiveLogger.event(start, e));

  // GENERATE PREPARE FUNCTIONS
  const prepareResults: IAutoBeTestPrepareWriteResult[] =
    await orchestrateTestPrepareWrite(agent.getContext(), {
      instruction: "Generate prepare functions for the operations.",
      document,
    });

  // COMPILE TEST
  const files: Record<string, string> = Object.fromEntries([
    ...Object.entries(await agent.getFiles()).filter(
      ([key]) => key.endsWith(".ts") && !key.startsWith("test/"),
    ),
    ...prepareResults.map((r) => [r.function.location, r.function.content]),
  ]);

  const compiler: IAutoBeCompiler = await agent.getContext().compiler();
  const result: IAutoBeTypeScriptCompileResult =
    await compiler.typescript.compile({
      files: {
        ...Object.fromEntries(
          Object.entries(files).filter(([key]) => key.endsWith(".ts")),
        ),
      },
    });

  // SAVE RESULTS
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${props.vendor}/${props.project}/test/prepare`,
    files: {
      ...files,
      "logs/prepare-functions.json": JSON.stringify(
        prepareResults.map((r) => r.function),
        null,
        2,
      ),
      "logs/compiled.json": JSON.stringify(result, null, 2),
    },
  });

  if (TestGlobal.archive) {
    await AutoBeExampleStorage.save({
      vendor: props.vendor,
      project: props.project,
      files: {
        [`test.write-prepare.json`]: JSON.stringify(prepareResults),
      },
    });
  }

  // VALIDATE RESULTS
  if (prepareResults.length === 0) {
    console.warn(`⚠️  No prepare functions were created for ${props.project}`);
    return true; // Don't fail, just warn
  }

  if (result.type === "success") return true;
  if (result.type === "exception") return false;

  console.error(`❌ Compilation failed for ${props.project} prepare functions`);
  console.error(JSON.stringify(result.diagnostics, null, 2));

  return await validate_agent_test_prepare_correct({
    factory: props.factory,
    vendor: props.vendor,
    project: props.project,
    props: {
      agent,
      prepareResults,
    },
  });
};

const validate_agent_test_prepare_correct = async <
  Model extends ILlmSchema.Model,
>(props: {
  factory: TestFactory;
  vendor: string;
  project: AutoBeExampleProject;
  props: {
    agent: AutoBeAgent<Model>;
    prepareResults: IAutoBeTestPrepareWriteResult[];
  };
}) => {
  const { agent, prepareResults } = props.props;
  // CORRECT
  const correctResults: AutoBeTestValidateEvent[] =
    await orchestrateTestCorrect(agent.getContext(), {
      instruction: "Generate prepare functions for the operations.",
      items: prepareResults,
    });

  const files: Record<string, string> = Object.fromEntries([
    ...Object.entries(await agent.getFiles()).filter(
      ([key]) => key.endsWith(".ts") && !key.startsWith("test/"),
    ),
    ...correctResults.map((c) => [c.function.location, c.function.content]),
  ]);

  const compiler: IAutoBeCompiler = await agent.getContext().compiler();
  const compiled: IAutoBeTypeScriptCompileResult =
    await compiler.typescript.compile({
      files: {
        ...Object.fromEntries(
          Object.entries(files).filter(([key]) => key.endsWith(".ts")),
        ),
      },
    });

  // SAVE RESULTS
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${props.vendor}/${props.project}/test/prepare-correct`,
    files: {
      ...files,
      "logs/prepare-correct-functions.json": JSON.stringify(
        correctResults.map((c) => c.function),
        null,
        2,
      ),
      "logs/compiled.json": JSON.stringify(compiled, null, 2),
    },
  });

  if (TestGlobal.archive) {
    await AutoBeExampleStorage.save({
      vendor: props.vendor,
      project: props.project,
      files: {
        [`test.write-prepare-correct.json`]: JSON.stringify(correctResults),
      },
    });
  }

  if (compiled.type === "success") return true;
  if (compiled.type === "exception") return false;

  console.error(`❌ Compilation failed for ${props.project} prepare functions`);
  console.error(JSON.stringify(compiled.diagnostics, null, 2));

  return false;
};
