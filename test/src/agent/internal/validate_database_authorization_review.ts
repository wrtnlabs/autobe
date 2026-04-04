import { AutoBeAgent } from "@autobe/agent";
import { orchestrateDatabaseAuthorizationReview } from "@autobe/agent/src/orchestrate/database/orchestrateDatabaseAuthorizationReview";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeDatabaseComponent,
  AutoBeExampleProject,
} from "@autobe/interface";

import { validate_database_authorization } from "./validate_database_authorization";

export const validate_database_authorization_review = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<AutoBeDatabaseComponent | null> => {
  const component: AutoBeDatabaseComponent | null =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "prisma.authorization.json",
    })) ?? (await validate_database_authorization(props));

  if (component === null) return null;

  const reviewed: AutoBeDatabaseComponent =
    await orchestrateDatabaseAuthorizationReview(props.agent.getContext(), {
      component,
      instruction: "",
    });
  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["prisma.authorization.review.json"]: JSON.stringify(reviewed),
    },
  });
  return reviewed;
};
