import { AutoBeAgent } from "@autobe/agent";
import { orchestrateTestPrepare } from "@autobe/agent/src/orchestrate/test/orchestrateTestPrepare";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeExampleProject,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeTestPrepareFunction,
} from "@autobe/interface";

export const validate_test_prepare = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<AutoBeTestPrepareFunction[]> => {
  const document: AutoBeOpenApi.IDocument = props.agent.getContext().state()
    .interface!.document;
  const writeProgress: AutoBeProgressEventBase = {
    completed: 0,
    total: 0,
  };
  const correctProgress: AutoBeProgressEventBase = {
    completed: 0,
    total: 0,
  };

  const prepares: AutoBeTestPrepareFunction[] = await orchestrateTestPrepare(
    props.agent.getContext(),
    {
      instruction: "",
      document,
      writeProgress,
      correctProgress,
    },
  );

  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["test.prepare.json"]: JSON.stringify(prepares),
    },
  });
  return prepares;
};
