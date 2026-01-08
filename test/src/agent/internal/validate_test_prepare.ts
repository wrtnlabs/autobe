import { AutoBeAgent } from "@autobe/agent";
import { AutoBeContext } from "@autobe/agent/src/context/AutoBeContext";
import { orchestrateTestPrepare } from "@autobe/agent/src/orchestrate/test/orchestrateTestPrepare";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeExampleProject,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeTestPrepareFunction,
} from "@autobe/interface";
import { AutoBeOpenApiTypeChecker } from "@autobe/utils";

import { assert_test_compilation } from "./assert_test_compilation";

export const validate_test_prepare = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<AutoBeTestPrepareFunction[]> => {
  const ctx: AutoBeContext = props.agent.getContext();
  const document: AutoBeOpenApi.IDocument = ctx.state().interface!.document;

  const writeProgress: AutoBeProgressEventBase = {
    completed: 0,
    total: Object.entries(document.components.schemas).filter(
      ([k, v]) =>
        k.endsWith(".ICreate") && AutoBeOpenApiTypeChecker.isObject(v),
    ).length,
  };
  const correctProgress: AutoBeProgressEventBase = {
    completed: 0,
    total: 0,
  };
  const prepares: AutoBeTestPrepareFunction[] = await orchestrateTestPrepare(
    ctx,
    {
      instruction: "",
      document,
      writeProgress,
      correctProgress,
    },
  );

  await assert_test_compilation({
    ...props,
    functions: prepares,
    type: "prepare",
  });
  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["test.prepare.json"]: JSON.stringify(prepares),
    },
  });
  return prepares;
};
