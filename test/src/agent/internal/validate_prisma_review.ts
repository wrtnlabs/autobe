import { AutoBeAgent } from "@autobe/agent";
import { orchestratePrismaReview } from "@autobe/agent/src/orchestrate/prisma/orchestratePrismaReview";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeDatabase,
  AutoBeDatabaseComponentEvent,
  AutoBeDatabaseReviewEvent,
  AutoBeDatabaseSchemaEvent,
  AutoBeExampleProject,
} from "@autobe/interface";

import { validate_prisma_component } from "./validate_prisma_component";
import { validate_prisma_schema } from "./validate_prisma_schema";

export const validate_prisma_review = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<AutoBeDatabaseReviewEvent[]> => {
  const component: AutoBeDatabaseComponentEvent =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "prisma.component.json",
    })) ?? (await validate_prisma_component(props));
  const writeEvents: AutoBeDatabaseSchemaEvent[] =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "prisma.schema.json",
    })) ?? (await validate_prisma_schema(props));

  const events: AutoBeDatabaseReviewEvent[] = await orchestratePrismaReview(
    props.agent.getContext(),
    {
      files: writeEvents.map((e) => e.file),
    } satisfies AutoBeDatabase.IApplication,
    component.components,
  );
  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["prisma.review.json"]: JSON.stringify(events),
    },
  });
  return events;
};
