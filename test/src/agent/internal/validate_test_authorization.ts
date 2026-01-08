import { AutoBeAgent } from "@autobe/agent";
import { AutoBeContext } from "@autobe/agent/src/context/AutoBeContext";
import { orchestrateTestAuthorize } from "@autobe/agent/src/orchestrate/test/orchestrateTestAuthorize";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeExampleProject,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeTestAuthorizeFunction,
} from "@autobe/interface";

import { assert_test_compilation } from "./assert_test_compilation";

export const validate_test_authorization = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<AutoBeTestAuthorizeFunction[]> => {
  const ctx: AutoBeContext = props.agent.getContext();
  const document: AutoBeOpenApi.IDocument = ctx.state().interface!.document;

  const writeProgress: AutoBeProgressEventBase = {
    completed: 0,
    total: document.operations.filter(
      (op) =>
        op.authorizationType !== null &&
        op.requestBody !== null &&
        op.responseBody !== null,
    ).length,
  };
  const correctProgress: AutoBeProgressEventBase = {
    completed: 0,
    total: 0,
  };
  const authorizes: AutoBeTestAuthorizeFunction[] =
    await orchestrateTestAuthorize(ctx, {
      instruction: "",
      document,
      writeProgress,
      correctProgress,
    });

  await assert_test_compilation({
    ...props,
    functions: authorizes,
    type: "authorize",
  });
  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["test.authorization.json"]: JSON.stringify(authorizes),
    },
  });
  return authorizes;
};
