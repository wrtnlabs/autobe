import { AutoBeAgent } from "@autobe/agent";
import { AutoBeContext } from "@autobe/agent/src/context/AutoBeContext";
import { orchestrateTestGenerate } from "@autobe/agent/src/orchestrate/test/orchestrateTestGenerate";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeExampleProject,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeTestGenerateFunction,
  AutoBeTestPrepareFunction,
} from "@autobe/interface";

import { assert_test_compilation } from "./assert_test_compilation";
import { validate_test_prepare } from "./validate_test_prepare";

export const validate_test_generate = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<AutoBeTestGenerateFunction[]> => {
  const ctx: AutoBeContext = props.agent.getContext();
  const document: AutoBeOpenApi.IDocument = ctx.state().interface!.document;

  // Load prepares
  const prepares: AutoBeTestPrepareFunction[] =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "test.prepare.json",
    })) ?? (await validate_test_prepare(props));

  const writeProgress: AutoBeProgressEventBase = {
    completed: 0,
    total: prepares.length,
  };
  const correctProgress: AutoBeProgressEventBase = {
    completed: 0,
    total: 0,
  };
  const generates: AutoBeTestGenerateFunction[] = await orchestrateTestGenerate(
    ctx,
    {
      instruction: "",
      document,
      prepares,
      writeProgress,
      correctProgress,
    },
  );

  await assert_test_compilation({
    ...props,
    functions: [...prepares, ...generates],
    type: "generate",
  });
  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["test.generate.json"]: JSON.stringify(generates),
    },
  });
  return generates;
};
