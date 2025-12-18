import { AutoBeAgent } from "@autobe/agent";
import { orchestrateTestCorrect } from "@autobe/agent/src/orchestrate/test/orchestrateTestCorrect";
import { orchestrateTestGenerationWrite } from "@autobe/agent/src/orchestrate/test/orchestrateTestGenerationWrite";
import { IAutoBeTestGenerateWriteResult } from "@autobe/agent/src/orchestrate/test/structures/IAutoBeTestGenerateWriteResult";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeEventOfSerializable,
  AutoBeOpenApi,
  AutoBeTestPrepareWriteFunction,
  AutoBeTestValidateEvent,
  IAutoBeCompiler,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { AutoBeExampleProject } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { ILlmSchema } from "@samchon/openapi";
import typia from "typia";
import { NamingConvention } from "typia/lib/utils/NamingConvention";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { ArchiveLogger } from "../../../archive/utils/ArchiveLogger";
import { prepare_agent_test } from "./prepare_agent_test";

export const validate_agent_test_generation_write = async (props: {
  factory: TestFactory;
  vendor: string;
  project: AutoBeExampleProject;
}) => {
  if (TestGlobal.env.OPENAI_API_KEY === undefined) return false;

  // PREPARE ASSETS
  const { agent, interface: interfaceState } = await prepare_agent_test(props);

  // Get operations and document from interface state
  const operations: AutoBeOpenApi.IOperation[] =
    interfaceState.document.operations;
  const document: AutoBeOpenApi.IDocument = interfaceState.document;

  // Create mock prepare functions for testing
  const preparedFunctions: AutoBeTestPrepareWriteFunction[] = [];

  // Create prepare functions based on create operations
  operations
    .filter(
      (op) =>
        op.method === "post" && op.requestBody?.typeName?.includes("ICreate"),
    )
    .forEach((op) => {
      const segments = op.path.split("/").filter(Boolean);
      const resourceName =
        segments[segments.length - 1]?.replace(/-/g, "_") || "resource";

      const functionName: string = `prepare_random_${NamingConvention.snake(resourceName)}`;

      preparedFunctions.push({
        type: "prepare",
        endpoint: {
          method: op.method,
          path: op.path,
        },
        dtoTypeName: op.requestBody!.typeName,
        location: `test/features/utils/prepare/${functionName}.ts`,
        functionName,
        content: StringUtil.trim`// Mock prepare function for ${resourceName}
        export const ${functionName} = (
          input?: any
        ): any => 1;
        `,
      });
    });

  const start: Date = new Date();
  for (const type of typia.misc.literals<AutoBeEventOfSerializable.Type>())
    agent.on(type, (event) => ArchiveLogger.event(start, event));
  agent.on("vendorResponse", (e) => ArchiveLogger.event(start, e));

  // GENERATE GENERATION FUNCTIONS
  const generationResults: IAutoBeTestGenerateWriteResult[] =
    await orchestrateTestGenerationWrite(agent.getContext(), {
      instruction: "Generate generation functions for the prepared functions.",
      document,
      preparedFunctions,
    });

  // COMPILE TEST
  const files: Record<string, string> = Object.fromEntries([
    ...Object.entries(await agent.getFiles()).filter(
      ([key]) => key.endsWith(".ts") && !key.startsWith("test/"),
    ),
    ...generationResults.map((r) => [r.function.location, r.function.content]),
    ...preparedFunctions.map((f) => [f.location, f.content]),
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
    root: `${TestGlobal.ROOT}/results/${props.vendor}/${props.project}/test/generation`,
    files: {
      ...files,
      "logs/generation-functions.json": JSON.stringify(
        generationResults.map((r) => r.function),
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
        [`test.write-generation.json`]: JSON.stringify(generationResults),
      },
    });
  }

  // VALIDATE RESULTS
  if (generationResults.length === 0) {
    console.warn(
      `⚠️  No generation functions were created for ${props.project}`,
    );
    return true; // Don't fail, just warn
  }

  if (result.type === "success") return true;
  if (result.type === "exception") return false;

  console.error(
    `❌ Compilation failed for ${props.project} generation functions`,
  );
  console.error(JSON.stringify(result.diagnostics, null, 2));

  return await validate_agent_test_generation_correct({
    factory: props.factory,
    vendor: props.vendor,
    project: props.project,
    props: {
      agent,
      generationResults,
    },
  });
};

const validate_agent_test_generation_correct = async <
  Model extends ILlmSchema.Model,
>(props: {
  factory: TestFactory;
  vendor: string;
  project: AutoBeExampleProject;
  props: {
    agent: AutoBeAgent<Model>;
    generationResults: IAutoBeTestGenerateWriteResult[];
  };
}) => {
  const { agent, generationResults } = props.props;
  const preparedFunctions: AutoBeTestPrepareWriteFunction[] =
    generationResults.map((r) => r.prepareFunction);
  // CORRECT
  const correctResults: AutoBeTestValidateEvent[] =
    await orchestrateTestCorrect(agent.getContext(), {
      instruction: "Generate generation functions for the prepared functions.",
      items: generationResults,
    });

  const files: Record<string, string> = Object.fromEntries([
    ...Object.entries(await agent.getFiles()).filter(
      ([key]) => key.endsWith(".ts") && !key.startsWith("test/"),
    ),
    ...correctResults.map((c) => [c.function.location, c.function.content]),
    ...preparedFunctions.map((f) => [f.location, f.content]),
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
    root: `${TestGlobal.ROOT}/results/${props.vendor}/${props.project}/test/generation-correct`,
    files: {
      ...files,
      "logs/generation-correct-functions.json": JSON.stringify(
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
        [`test.write-generation-correct.json`]: JSON.stringify(correctResults),
      },
    });
  }

  if (compiled.type === "success") return true;
  if (compiled.type === "exception") return false;

  console.error(
    `❌ Compilation failed for ${props.project} generation functions`,
  );
  console.error(JSON.stringify(compiled.diagnostics, null, 2));

  return false;
};
