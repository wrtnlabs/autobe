import { AutoBeAgent } from "@autobe/agent";
import { orchestratePrismaSchema } from "@autobe/agent/src/orchestrate/prisma/orchestratePrismaSchema";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeDatabaseComponentEvent,
  AutoBeDatabaseSchemaEvent,
  AutoBeExampleProject,
} from "@autobe/interface";

import { validate_prisma_component } from "./validate_prisma_component";

export const validate_prisma_schema = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<AutoBeDatabaseSchemaEvent[]> => {
  const component: AutoBeDatabaseComponentEvent =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "prisma.component.json",
    })) ?? (await validate_prisma_component(props));

  const events: AutoBeDatabaseSchemaEvent[] = await orchestratePrismaSchema(
    props.agent.getContext(),
    "",
    component.components,
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
