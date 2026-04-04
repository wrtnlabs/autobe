import { AutoBeAgent } from "@autobe/agent";
import { orchestrateDatabaseComponentReview } from "@autobe/agent/src/orchestrate/database/orchestrateDatabaseComponentReview";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeDatabaseComponent,
  AutoBeExampleProject,
} from "@autobe/interface";

import { validate_database_component } from "./validate_database_component";

export const validate_database_component_review = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<AutoBeDatabaseComponent[]> => {
  const components: AutoBeDatabaseComponent[] =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "prisma.component.json",
    })) ?? (await validate_database_component(props));

  const reviewedComponents: AutoBeDatabaseComponent[] =
    await orchestrateDatabaseComponentReview(props.agent.getContext(), {
      components,
      instruction: "",
    });
  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["prisma.component.review.json"]: JSON.stringify(reviewedComponents),
    },
  });
  return reviewedComponents;
};
