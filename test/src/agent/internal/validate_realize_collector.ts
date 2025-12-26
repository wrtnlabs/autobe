import { AutoBeAgent } from "@autobe/agent";
import { orchestrateRealizeCollector } from "@autobe/agent/src/orchestrate/realize/orchestrateRealizeCollector";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeExampleProject,
  AutoBeProgressEventBase,
  AutoBeRealizeCollectorFunction,
} from "@autobe/interface";

export const validate_realize_collector = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<AutoBeRealizeCollectorFunction[]> => {
  const progress = (): AutoBeProgressEventBase => ({
    total: 0,
    completed: 0,
  });
  const collectors: AutoBeRealizeCollectorFunction[] =
    await orchestrateRealizeCollector(props.agent.getContext(), {
      planProgress: progress(),
      writeProgress: progress(),
      correctProgress: progress(),
    });
  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["realize.collector.json"]: JSON.stringify(collectors),
    },
  });
  return collectors;
};
