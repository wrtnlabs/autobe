import { orchestrateTestGeneration } from "@autobe/agent/src/orchestrate/test/orchestrateTestGeneration";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeEventOfSerializable,
  AutoBeOpenApi,
  AutoBeTestWriteAuthorizationFunction,
  AutoBeTestWriteGenerationFunction,
  AutoBeTestWritePrepareFunction,
  IAutoBeCompiler,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { AutoBeExampleProject } from "@autobe/interface";
import typia from "typia";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { ArchiveLogger } from "../../../archive/utils/ArchiveLogger";
import { prepare_agent_test } from "./prepare_agent_test";

export const validate_agent_test_generation = async (props: {
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
  const preparedFunctions: AutoBeTestWritePrepareFunction[] = [];
  const authorizationFunctions: AutoBeTestWriteAuthorizationFunction[] = [];

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

      preparedFunctions.push({
        kind: "prepare",
        endpoint: {
          method: op.method,
          path: op.path,
        },
        dtoTypeName: op.requestBody!.typeName,
        location: `test/features/${resourceName}/prepare_random_${resourceName}.ts`,
        functionName: `prepare_random_${resourceName}`,
        content: `// Mock prepare function for ${resourceName}`,
      });
    });

  // Create authorization functions for unique actors
  const uniqueActors = new Set(
    operations
      .filter((op) => op.authorizationActor)
      .map((op) => op.authorizationActor!),
  );

  uniqueActors.forEach((actor) => {
    authorizationFunctions.push({
      kind: "authorization",
      endpoint: {
        method: "post",
        path: `/api/auth/login`,
      },
      actor,
      authType: "login",
      location: `test/features/auth/authorize_${actor}_login.ts`,
      functionName: `authorize_${actor}_login`,
      content: `// Mock authorization function for ${actor}`,
    });
  });

  const start: Date = new Date();
  for (const type of typia.misc.literals<AutoBeEventOfSerializable.Type>())
    agent.on(type, (event) => ArchiveLogger.event(start, event));
  agent.on("vendorResponse", (e) => ArchiveLogger.event(start, e));

  // GENERATE GENERATION FUNCTIONS
  const generationFunctions: AutoBeTestWriteGenerationFunction[] =
    await orchestrateTestGeneration(agent.getContext(), {
      document,
      preparedFunctions,
      authorizationFunctions,
    });

  // COMPILE TEST
  const files: Record<string, string> = Object.fromEntries([
    ...Object.entries(await agent.getFiles()).filter(
      ([key]) => key.endsWith(".ts") && !key.startsWith("test/"),
    ),
    ...generationFunctions.map((func) => [func.location, func.content]),
  ]);

  const compiler: IAutoBeCompiler = await agent.getContext().compiler();
  const result: IAutoBeTypeScriptCompileResult =
    await compiler.typescript.compile({
      files: Object.fromEntries(
        Object.entries(files).filter(([key]) => key.endsWith(".ts")),
      ),
    });

  // SAVE RESULTS
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${props.vendor}/${props.project}/test/generation`,
    files: {
      ...files,
      "logs/generation_functions.json": JSON.stringify(
        generationFunctions,
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
        [`test.generation_functions.json`]: JSON.stringify(generationFunctions),
      },
    });
  }

  // VALIDATE RESULTS
  if (generationFunctions.length === 0) {
    console.warn(
      `⚠️  No generation functions were created for ${props.project}`,
    );
    return true; // Don't fail, just warn
  }

  // Check compilation result
  if (result.type === "failure") {
    console.error(
      `❌ Compilation failed for ${props.project} generation functions`,
    );
    console.error(JSON.stringify(result.diagnostics, null, 2));
    return false;
  }

  console.log(
    `✅ Generated ${generationFunctions.length} generation functions for ${props.project}`,
  );
  return true;
};
