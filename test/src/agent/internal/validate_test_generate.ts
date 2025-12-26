import { AutoBeAgent } from "@autobe/agent";
import { orchestrateTestGenerate } from "@autobe/agent/src/orchestrate/test/orchestrateTestGenerate";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeExampleProject,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeTestGenerateFunction,
  AutoBeTestPrepareFunction,
} from "@autobe/interface";

import { validate_test_prepare } from "./validate_test_prepare";

export const validate_test_generate = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<AutoBeTestGenerateFunction[]> => {
  const document: AutoBeOpenApi.IDocument = props.agent.getContext().state()
    .interface!.document;

  // Load prepares
  const prepares: AutoBeTestPrepareFunction[] =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "test.prepare.json",
    })) ?? (await validate_test_prepare(props));

  const writeProgress: AutoBeProgressEventBase = {
    completed: 0,
    total: 0,
  };
  const correctProgress: AutoBeProgressEventBase = {
    completed: 0,
    total: 0,
  };

  const generates: AutoBeTestGenerateFunction[] = await orchestrateTestGenerate(
    props.agent.getContext(),
    {
      instruction: "",
      document,
      prepares,
      writeProgress,
      correctProgress,
    },
  );

  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["test.generate.json"]: JSON.stringify(generates),
    },
  });
  return generates;
};
