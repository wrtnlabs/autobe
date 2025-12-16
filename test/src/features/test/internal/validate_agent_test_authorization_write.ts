import { AutoBeAgent } from "@autobe/agent";
import { orchestrateTestAuthorizationWrite } from "@autobe/agent/src/orchestrate/test/orchestrateTestAuthorizationWrite";
import { orchestrateTestCorrect } from "@autobe/agent/src/orchestrate/test/orchestrateTestCorrect";
import { IAutoBeTestAuthorizeWriteResult } from "@autobe/agent/src/orchestrate/test/structures/IAutoBeTestAuthorizeWriteResult";
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

export const validate_agent_test_authorization_write = async (props: {
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

  const start: Date = new Date();
  for (const type of typia.misc.literals<AutoBeEventOfSerializable.Type>())
    agent.on(type, (event) => ArchiveLogger.event(start, event));
  agent.on("vendorResponse", (e) => ArchiveLogger.event(start, e));

  // GENERATE AUTHORIZATION FUNCTIONS
  const authorizationResults: IAutoBeTestAuthorizeWriteResult[] =
    await orchestrateTestAuthorizationWrite(agent.getContext(), {
      operations,
    });

  // COMPILE TEST
  const files: Record<string, string> = Object.fromEntries([
    ...Object.entries(await agent.getFiles()).filter(
      ([key]) => key.endsWith(".ts") && !key.startsWith("test/"),
    ),
    ...authorizationResults.map((r) => [
      r.function.location,
      r.function.content,
    ]),
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
    root: `${TestGlobal.ROOT}/results/${props.vendor}/${props.project}/test/authorization`,
    files: {
      ...files,
      "logs/authorization-functions.json": JSON.stringify(
        authorizationResults.map((r) => r.function),
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
        [`test.write-authorization.json`]: JSON.stringify(authorizationResults),
      },
    });
  }

  // VALIDATE RESULTS
  if (authorizationResults.length === 0) {
    console.warn(
      `⚠️  No authorization functions were created for ${props.project}`,
    );
    return true; // Don't fail, just warn
  }

  if (result.type === "success") return true;
  if (result.type === "exception") return false;

  console.error(
    `❌ Compilation failed for ${props.project} authorization functions`,
  );
  console.error(JSON.stringify(result.diagnostics, null, 2));

  return await validate_agent_test_authorization_correct({
    factory: props.factory,
    vendor: props.vendor,
    project: props.project,
    props: {
      agent,
      authorizationResults,
    },
  });
};

const validate_agent_test_authorization_correct = async <
  Model extends ILlmSchema.Model,
>(props: {
  factory: TestFactory;
  vendor: string;
  project: AutoBeExampleProject;
  props: {
    agent: AutoBeAgent<Model>;
    authorizationResults: IAutoBeTestAuthorizeWriteResult[];
  };
}) => {
  const { agent, authorizationResults } = props.props;
  // CORRECT
  const correctResults: AutoBeTestValidateEvent[] =
    await orchestrateTestCorrect(agent.getContext(), {
      instruction: "Generate authorization functions.",
      items: authorizationResults,
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
    root: `${TestGlobal.ROOT}/results/${props.vendor}/${props.project}/test/authorization-correct`,
    files: {
      ...files,
      "logs/authorization-correct-functions.json": JSON.stringify(
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
        [`test.write-authorization-correct.json`]:
          JSON.stringify(correctResults),
      },
    });
  }

  if (compiled.type === "success") return true;
  if (compiled.type === "exception") return false;

  console.error(
    `❌ Compilation failed for ${props.project} authorization functions`,
  );
  console.error(JSON.stringify(compiled.diagnostics, null, 2));

  return false;
};
