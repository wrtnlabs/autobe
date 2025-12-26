import { AutoBeAgent } from "@autobe/agent";
import { orchestrateRealizeCollector } from "@autobe/agent/src/orchestrate/realize/orchestrateRealizeCollector";
import { orchestrateRealizeTransformer } from "@autobe/agent/src/orchestrate/realize/orchestrateRealizeTransformer";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeExampleProject,
  AutoBeProgressEventBase,
  AutoBeRealizeCollectorFunction,
  AutoBeRealizeTransformerFunction,
} from "@autobe/interface";

export const validate_realize_modularization = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<{
  collectors: AutoBeRealizeCollectorFunction[];
  transformers: AutoBeRealizeTransformerFunction[];
}> => {
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
  const transformers: AutoBeRealizeTransformerFunction[] =
    await orchestrateRealizeTransformer(props.agent.getContext(), {
      planProgress: progress(),
      writeProgress: progress(),
      correctProgress: progress(),
    });
  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["realize.modularization.json"]: JSON.stringify({
        collectors,
        transformers,
      }),
    },
  });
  return { collectors, transformers };
};
