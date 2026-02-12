import { AutoBeAgent } from "@autobe/agent";
import { orchestratePrismaGroupReview } from "@autobe/agent/src/orchestrate/prisma/orchestratePrismaGroupReview";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { AutoBeDatabaseGroup, AutoBeExampleProject } from "@autobe/interface";

import { validate_prisma_group } from "./validate_prisma_group";

export const validate_prisma_group_review = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<AutoBeDatabaseGroup[]> => {
  const groups: AutoBeDatabaseGroup[] =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "prisma.group.json",
    })) ?? (await validate_prisma_group(props));

  const reviewedGroups: AutoBeDatabaseGroup[] =
    await orchestratePrismaGroupReview(props.agent.getContext(), {
      groups,
      instruction: "",
    });
  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["prisma.group.review.json"]: JSON.stringify(reviewedGroups),
    },
  });
  return reviewedGroups;
};
