import { AutoBeAgent } from "@autobe/agent";
import { orchestratePrismaAuthorization } from "@autobe/agent/src/orchestrate/prisma/orchestratePrismaAuthorization";
import { orchestratePrismaAuthorizationReview } from "@autobe/agent/src/orchestrate/prisma/orchestratePrismaAuthorizationReview";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeAnalyzeActor,
  AutoBeDatabaseComponent,
  AutoBeDatabaseGroup,
  AutoBeExampleProject,
} from "@autobe/interface";
import { Pair } from "tstl";

import { validate_prisma_group } from "./validate_prisma_group";

export const validate_prisma_authorization = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<AutoBeDatabaseComponent[]> => {
  // Get groups first (need authorization group)
  const groups: AutoBeDatabaseGroup[] =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "prisma.group.json",
    })) ?? (await validate_prisma_group(props));

  // Process authorization tables for each actor
  const pairs: Pair<AutoBeAnalyzeActor, AutoBeDatabaseComponent>[] =
    await orchestratePrismaAuthorization(props.agent.getContext(), {
      instruction: "",
      groups,
    });
  const reviewed: AutoBeDatabaseComponent[] =
    await orchestratePrismaAuthorizationReview(props.agent.getContext(), {
      instruction: "",
      pairs,
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
