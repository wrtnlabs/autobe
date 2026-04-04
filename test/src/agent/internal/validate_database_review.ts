import { AutoBeAgent } from "@autobe/agent";
import { orchestrateDatabaseSchemaReview } from "@autobe/agent/src/orchestrate/database/orchestrateDatabaseSchemaReview";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeDatabase,
  AutoBeDatabaseComponent,
  AutoBeDatabaseSchemaEvent,
  AutoBeDatabaseSchemaReviewEvent,
  AutoBeExampleProject,
} from "@autobe/interface";

import { validate_database_component } from "./validate_database_component";
import { validate_database_schema } from "./validate_database_schema";

export const validate_database_schema_review = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<AutoBeDatabaseSchemaReviewEvent[]> => {
  const components: AutoBeDatabaseComponent[] =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "prisma.component.json",
    })) ?? (await validate_database_component(props));
  const writeEvents: AutoBeDatabaseSchemaEvent[] =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "prisma.schema.json",
    })) ?? (await validate_database_schema(props));

  const events: AutoBeDatabaseSchemaReviewEvent[] =
    await orchestrateDatabaseSchemaReview(props.agent.getContext(), {
      application: {
        files: components.map((c) => ({
          filename: c.filename,
          namespace: c.namespace,
          models: writeEvents
            .filter((we) => we.namespace === c.namespace)
            .map((we) => we.definition.model),
        })),
      } satisfies AutoBeDatabase.IApplication,
      components,
      reviewed: new Set(),
      progress: {
        completed: 0,
        total: 0,
      },
    });
  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["prisma.review.json"]: JSON.stringify(events),
    },
  });
  return events;
};
