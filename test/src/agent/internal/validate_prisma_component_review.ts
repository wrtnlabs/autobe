import { AutoBeAgent } from "@autobe/agent";
import { orchestratePrismaComponentReview } from "@autobe/agent/src/orchestrate/prisma/orchestratePrismaComponentReview";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeDatabaseComponent,
  AutoBeExampleProject,
} from "@autobe/interface";

import { validate_prisma_component } from "./validate_prisma_component";

export const validate_prisma_component_review = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<AutoBeDatabaseComponent[]> => {
  const components: AutoBeDatabaseComponent[] =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "prisma.component.json",
    })) ?? (await validate_prisma_component(props));

  const reviewedComponents: AutoBeDatabaseComponent[] =
    await orchestratePrismaComponentReview(props.agent.getContext(), {
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
