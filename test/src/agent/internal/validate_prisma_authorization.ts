import { AutoBeAgent } from "@autobe/agent";
import { orchestratePrismaAuthorization } from "@autobe/agent/src/orchestrate/prisma/orchestratePrismaAuthorization";
import { orchestratePrismaAuthorizationReview } from "@autobe/agent/src/orchestrate/prisma/orchestratePrismaAuthorizationReview";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeDatabaseComponent,
  AutoBeDatabaseGroup,
  AutoBeExampleProject,
} from "@autobe/interface";

import { validate_prisma_group } from "./validate_prisma_group";

export const validate_prisma_authorization = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<AutoBeDatabaseComponent | null> => {
  // Get groups first (need authorization group)
  const groups: AutoBeDatabaseGroup[] =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "prisma.group.json",
    })) ?? (await validate_prisma_group(props));

  // Process authorization tables for all actors
  const component: AutoBeDatabaseComponent | null =
    await orchestratePrismaAuthorization(props.agent.getContext(), {
      instruction: "",
      groups,
    });
  if (component === null) return null;

  const reviewed: AutoBeDatabaseComponent =
    await orchestratePrismaAuthorizationReview(props.agent.getContext(), {
      instruction: "",
      component,
    });

  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["prisma.authorization.json"]: JSON.stringify(reviewed),
    },
  });
  return reviewed;
};
