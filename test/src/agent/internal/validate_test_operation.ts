import { AutoBeAgent } from "@autobe/agent";
import { orchestrateTestOperation } from "@autobe/agent/src/orchestrate/test/orchestrateTestOperation";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeExampleProject,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeTestAuthorizeFunction,
  AutoBeTestGenerateFunction,
  AutoBeTestOperationFunction,
  AutoBeTestPrepareFunction,
  AutoBeTestScenario,
} from "@autobe/interface";

import { validate_test_authorization } from "./validate_test_authorization";
import { validate_test_generate } from "./validate_test_generate";
import { validate_test_prepare } from "./validate_test_prepare";
import { validate_test_scenario } from "./validate_test_scenario";

export const validate_test_operation = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<AutoBeTestOperationFunction[]> => {
  const document: AutoBeOpenApi.IDocument = props.agent.getContext().state()
    .interface!.document;

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
    total: 0,
  };
  const correctProgress: AutoBeProgressEventBase = {
    completed: 0,
    total: 0,
  };

  const testOperations: AutoBeTestOperationFunction[] =
    await orchestrateTestOperation(props.agent.getContext(), {
      instruction: "",
      document,
      scenarios,
      authorizes,
      prepares,
      generates,
      writeProgress,
      correctProgress,
    });

  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["test.operation.json"]: JSON.stringify(testOperations),
    },
  });
  return testOperations;
};
