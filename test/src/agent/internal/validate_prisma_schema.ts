import { AutoBeAgent } from "@autobe/agent";
import { orchestratePrismaSchema } from "@autobe/agent/src/orchestrate/prisma/orchestratePrismaSchema";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeDatabaseComponent,
  AutoBeDatabaseSchemaEvent,
  AutoBeExampleProject,
} from "@autobe/interface";

import { validate_prisma_component_review } from "./validate_prisma_component_review";

export const validate_prisma_schema = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<AutoBeDatabaseSchemaEvent[]> => {
  const component: AutoBeDatabaseComponent[] =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "prisma.component.review.json",
    })) ?? (await validate_prisma_component_review(props));

  const events: AutoBeDatabaseSchemaEvent[] = await orchestratePrismaSchema(
    props.agent.getContext(),
    "",
    component,
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
