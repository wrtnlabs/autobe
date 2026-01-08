import { AutoBeAgent } from "@autobe/agent";
import { orchestratePrismaSchemaReview } from "@autobe/agent/src/orchestrate/prisma/orchestratePrismaSchemaReview";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeDatabase,
  AutoBeDatabaseComponent,
  AutoBeDatabaseSchemaEvent,
  AutoBeDatabaseSchemaReviewEvent,
  AutoBeExampleProject,
} from "@autobe/interface";

import { validate_prisma_component } from "./validate_prisma_component";
import { validate_prisma_schema } from "./validate_prisma_schema";

export const validate_prisma_schema_review = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<AutoBeDatabaseSchemaReviewEvent[]> => {
  const components: AutoBeDatabaseComponent[] =
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

  const events: AutoBeDatabaseSchemaReviewEvent[] =
    await orchestratePrismaSchemaReview(
      props.agent.getContext(),
      {
        files: components.map((c) => ({
          filename: c.filename,
          namespace: c.namespace,
          models: writeEvents
            .filter((we) => we.namespace === c.namespace)
            .map((we) => we.model),
        })),
      } satisfies AutoBeDatabase.IApplication,
      components,
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
