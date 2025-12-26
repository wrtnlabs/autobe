import { AutoBeAgent } from "@autobe/agent";
import { orchestrateRealizeTransformer } from "@autobe/agent/src/orchestrate/realize/orchestrateRealizeTransformer";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeExampleProject,
  AutoBeProgressEventBase,
  AutoBeRealizeTransformerFunction,
} from "@autobe/interface";

export const validate_realize_transformer = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<AutoBeRealizeTransformerFunction[]> => {
  const progress = (): AutoBeProgressEventBase => ({
    total: 0,
    completed: 0,
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
      ["realize.transformer.json"]: JSON.stringify(transformers),
    },
  });
  return transformers;
};
