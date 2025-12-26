import { AutoBeAgent } from "@autobe/agent";
import { orchestratePrismaComponents } from "@autobe/agent/src/orchestrate/prisma/orchestratePrismaComponent";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeExampleProject,
  AutoBePrismaComponentEvent,
} from "@autobe/interface";

export const validate_prisma_component = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<AutoBePrismaComponentEvent> => {
  const event: AutoBePrismaComponentEvent = await orchestratePrismaComponents(
    props.agent.getContext(),
    "",
  );
  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["prisma.component.json"]: JSON.stringify(event),
    },
  });
  return event;
};
