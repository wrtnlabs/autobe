import { AutoBeAgent } from "@autobe/agent";
import { orchestrateDatabaseGroupReview } from "@autobe/agent/src/orchestrate/database/orchestrateDatabaseGroupReview";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { AutoBeDatabaseGroup, AutoBeExampleProject } from "@autobe/interface";

import { validate_database_group } from "./validate_database_group";

export const validate_database_group_review = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<AutoBeDatabaseGroup[]> => {
  const groups: AutoBeDatabaseGroup[] =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "prisma.group.json",
    })) ?? (await validate_database_group(props));

  const reviewedGroups: AutoBeDatabaseGroup[] =
    await orchestrateDatabaseGroupReview(props.agent.getContext(), {
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
