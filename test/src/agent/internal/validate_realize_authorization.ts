import { AutoBeAgent } from "@autobe/agent";
import { orchestrateRealizeAuthorizationWrite } from "@autobe/agent/src/orchestrate/realize/orchestrateRealizeAuthorizationWrite";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeExampleProject,
  AutoBeRealizeAuthorization,
} from "@autobe/interface";

export const validate_realize_authorization = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<AutoBeRealizeAuthorization[]> => {
  const authorizations: AutoBeRealizeAuthorization[] =
    await orchestrateRealizeAuthorizationWrite(props.agent.getContext());
  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["realize.authorization.json"]: JSON.stringify(authorizations),
    },
  });
  return authorizations;
};
