import { AutoBeAgent, orchestrate } from "@autobe/agent";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeExampleProject,
  AutoBeInterfaceAuthorization,
} from "@autobe/interface";

export const validate_interface_authorization = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<AutoBeInterfaceAuthorization[]> => {
  const authorizations: AutoBeInterfaceAuthorization[] =
    await orchestrate.orchestrateInterfaceAuthorization(
      props.agent.getContext(),
      {
        instruction: "",
      },
    );
  console.log(
    "authorizations",
    JSON.stringify(
      authorizations
        .map((auth) => auth.operations)
        .flat()
        .map((op) => ({
          method: op.method,
          path: op.path,
        })),
      null,
      2,
    ),
  );
  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["interface.authorization.json"]: JSON.stringify(authorizations),
    },
  });
  return authorizations;
};
