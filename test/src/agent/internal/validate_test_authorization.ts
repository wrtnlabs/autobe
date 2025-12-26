import { AutoBeAgent } from "@autobe/agent";
import { orchestrateTestAuthorize } from "@autobe/agent/src/orchestrate/test/orchestrateTestAuthorize";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeExampleProject,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeTestAuthorizeFunction,
} from "@autobe/interface";

export const validate_test_authorization = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<AutoBeTestAuthorizeFunction[]> => {
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

  const authorizations: AutoBeTestAuthorizeFunction[] =
    await orchestrateTestAuthorize(props.agent.getContext(), {
      instruction: "",
      document,
      writeProgress,
      correctProgress,
    });

  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["test.authorization.json"]: JSON.stringify(authorizations),
    },
  });
  return authorizations;
};
