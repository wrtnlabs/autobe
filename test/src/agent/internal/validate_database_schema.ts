import { AutoBeAgent } from "@autobe/agent";
import { orchestrateDatabaseSchema } from "@autobe/agent/src/orchestrate/database/orchestrateDatabaseSchema";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeDatabaseComponent,
  AutoBeDatabaseSchemaEvent,
  AutoBeExampleProject,
} from "@autobe/interface";

import { validate_database_component_review } from "./validate_database_component_review";

export const validate_database_schema = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<AutoBeDatabaseSchemaEvent[]> => {
  const components: AutoBeDatabaseComponent[] =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "prisma.component.review.json",
    })) ?? (await validate_database_component_review(props));

  const events: AutoBeDatabaseSchemaEvent[] = await orchestrateDatabaseSchema(
    props.agent.getContext(),
    {
      instruction: "",
      components,
      written: new Set(),
      failed: new Map(),
      progress: {
        completed: 0,
        total: 0,
      },
    },
  );
  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["prisma.schema.json"]: JSON.stringify(events),
    },
  });
  return events;
};
