import { AutoBeAgent } from "@autobe/agent";
import { AutoBeContext } from "@autobe/agent/src/context/AutoBeContext";
import { orchestrateTestOperation } from "@autobe/agent/src/orchestrate/test/orchestrateTestOperation";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeExampleProject,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeTestAuthorizeFunction,
  AutoBeTestFunction,
  AutoBeTestGenerateFunction,
  AutoBeTestOperationFunction,
  AutoBeTestPrepareFunction,
  AutoBeTestScenario,
} from "@autobe/interface";
import { v7 } from "uuid";

import { assert_test_compilation } from "./assert_test_compilation";
import { validate_test_authorization } from "./validate_test_authorization";
import { validate_test_generate } from "./validate_test_generate";
import { validate_test_prepare } from "./validate_test_prepare";
import { validate_test_scenario } from "./validate_test_scenario";

export const validate_test_operation = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<AutoBeTestOperationFunction[]> => {
  const ctx: AutoBeContext = props.agent.getContext();
  const document: AutoBeOpenApi.IDocument = ctx.state().interface!.document;

  // Load dependencies
  const scenarios: AutoBeTestScenario[] =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "test.scenario.json",
    })) ?? (await validate_test_scenario(props));

  const authorizes: AutoBeTestAuthorizeFunction[] =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "test.authorization.json",
    })) ?? (await validate_test_authorization(props));

  const prepares: AutoBeTestPrepareFunction[] =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "test.prepare.json",
    })) ?? (await validate_test_prepare(props));

  const generates: AutoBeTestGenerateFunction[] =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "test.generate.json",
    })) ?? (await validate_test_generate(props));

  const writeProgress: AutoBeProgressEventBase = {
    completed: 0,
    total: scenarios.length,
  };
  const correctProgress: AutoBeProgressEventBase = {
    completed: 0,
    total: 0,
  };
  const testOperations: AutoBeTestOperationFunction[] =
    await orchestrateTestOperation(ctx, {
      instruction: "",
      document,
      scenarios,
      authorizes,
      prepares,
      generates,
      writeProgress,
      correctProgress,
    });

  const everyFunctions: AutoBeTestFunction[] = [
    ...authorizes,
    ...prepares,
    ...generates,
    ...testOperations,
  ];
  ctx.dispatch({
    type: "testComplete",
    id: v7(),
    functions: everyFunctions,
    compiled: await assert_test_compilation({
      ...props,
      functions: everyFunctions,
      type: "operation",
    }),
    aggregates: ctx.getCurrentAggregates("test"),
    step: ctx.state().analyze?.step ?? 0,
    elapsed: 1_000,
    created_at: new Date().toISOString(),
  });

  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["test.operation.json"]: JSON.stringify(testOperations),
    },
  });
  try {
    await FileSystemIterator.save({
      root: `${
        AutoBeExampleStorage.TEST_ROOT
      }/results/${AutoBeExampleStorage.slugModel(props.vendor, false)}/${
        props.project
      }/test`,
      files: {
        ...(await props.agent.getFiles()),
        "pnpm-workspace.yaml": "",
      },
    });
  } catch {}
  return testOperations;
};
