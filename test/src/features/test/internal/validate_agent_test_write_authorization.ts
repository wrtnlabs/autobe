import { orchestrateTestWriteAuthorization } from "@autobe/agent/src/orchestrate/test/orchestrateTestWriteAuthorization";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { AutoBeCompilerInterfaceTemplate } from "@autobe/compiler/src/raw/AutoBeCompilerInterfaceTemplate";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeEventOfSerializable,
  AutoBeOpenApi,
  AutoBeTestWriteAuthorizationFunction,
  IAutoBeCompiler,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { AutoBeExampleProject } from "@autobe/interface";
import typia from "typia";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { ArchiveLogger } from "../../../archive/utils/ArchiveLogger";
import { prepare_agent_test } from "./prepare_agent_test";

export const validate_agent_test_write_authorization = async (props: {
  factory: TestFactory;
  vendor: string;
  project: AutoBeExampleProject;
}) => {
  if (TestGlobal.env.OPENAI_API_KEY === undefined) return false;

  // PREPARE ASSETS
  const { agent } = await prepare_agent_test(props);

  // GET OPERATIONS FROM INTERFACE STATE
  const interfaceState = agent.getContext().state().interface;
  if (!interfaceState) {
    throw new Error("Interface state not found");
  }

  const operations: AutoBeOpenApi.IOperation[] =
    interfaceState.document.operations;

  const start: Date = new Date();
  for (const type of typia.misc.literals<AutoBeEventOfSerializable.Type>())
    agent.on(type, (event) => ArchiveLogger.event(start, event));
  agent.on("vendorResponse", (e) => ArchiveLogger.event(start, e));

  // GENERATE AUTHORIZATION FUNCTIONS
  const authFunctions: AutoBeTestWriteAuthorizationFunction[] =
    await orchestrateTestWriteAuthorization(agent.getContext(), {
      operations,
    });

  // REPORT RESULT
  const compiler: IAutoBeCompiler = await agent.getContext().compiler();
  const files: Record<string, string> = Object.fromEntries([
    ...Object.entries(await agent.getFiles()).filter(
      ([key]) => key.startsWith("test") === false,
    ),
    ...authFunctions.map((f) => [f.location, f.content]),
  ]);

  const result: IAutoBeTypeScriptCompileResult =
    await compiler.typescript.compile({
      files: Object.fromEntries(
        Object.entries(files).filter(
          ([key]) =>
            (key.startsWith("src/api") || key.startsWith("test/")) &&
            key.endsWith(".ts"),
        ),
      ),
    });

  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${props.vendor}/${props.project}/test/authorization`,
    files: {
      ...files,
      "test/tsconfig.json":
        AutoBeCompilerInterfaceTemplate["test/tsconfig.json"],
      "logs/auth_functions.json": JSON.stringify(authFunctions),
      "logs/compiled.json": JSON.stringify(result),
    },
  });

  if (TestGlobal.archive)
    await AutoBeExampleStorage.save({
      vendor: props.vendor,
      project: props.project,
      files: {
        [`test.write_authorization.json`]: JSON.stringify(authFunctions),
      },
    });
};
