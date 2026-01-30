import { AutoBeAgent } from "@autobe/agent";
import { orchestratePrismaAuthorizationReview } from "@autobe/agent/src/orchestrate/prisma/orchestratePrismaAuthorizationReview";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeDatabaseComponent,
  AutoBeExampleProject,
} from "@autobe/interface";

import { validate_prisma_authorization } from "./validate_prisma_authorization";

export const validate_prisma_authorization_review = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<AutoBeDatabaseComponent | null> => {
  const component: AutoBeDatabaseComponent | null =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "prisma.authorization.json",
    })) ?? (await validate_prisma_authorization(props));

  if (component === null) return null;

  const reviewed: AutoBeDatabaseComponent =
    await orchestratePrismaAuthorizationReview(props.agent.getContext(), {
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
