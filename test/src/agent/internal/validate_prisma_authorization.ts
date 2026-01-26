import { AutoBeAgent } from "@autobe/agent";
import { orchestratePrismaAuthorization } from "@autobe/agent/src/orchestrate/prisma/orchestratePrismaAuthorization";
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
}): Promise<AutoBeDatabaseComponent[]> => {
  // Get groups first (need authorization group)
  const groups: AutoBeDatabaseGroup[] =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "prisma.group.json",
    })) ?? (await validate_prisma_group(props));

  // Process authorization tables for each actor
  const components: AutoBeDatabaseComponent[] =
    await orchestratePrismaAuthorization(props.agent.getContext(), {
      instruction: "",
      groups,
    });

  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["prisma.authorization.json"]: JSON.stringify(components),
    },
  });
  return components;
};
