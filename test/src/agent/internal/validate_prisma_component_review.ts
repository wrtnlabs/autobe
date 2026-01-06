import { AutoBeAgent } from "@autobe/agent";
import { orchestratePrismaComponentReview } from "@autobe/agent/src/orchestrate/prisma/orchestratePrismaComponentReview";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeDatabaseComponentEvent,
  AutoBeDatabaseComponentReviewEvent,
  AutoBeExampleProject,
} from "@autobe/interface";

import { validate_prisma_component } from "./validate_prisma_component";

export const validate_prisma_component_review = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<AutoBeDatabaseComponentReviewEvent[]> => {
  const component: AutoBeDatabaseComponentEvent =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "prisma.component.json",
    })) ?? (await validate_prisma_component(props));

  const event: AutoBeDatabaseComponentReviewEvent[] =
    await orchestratePrismaComponentReview(props.agent.getContext(), {
      components: component.components,
      instruction: "",
    });
  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["prisma.component.review.json"]: JSON.stringify(event),
    },
  });
  return event;
};
