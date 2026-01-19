import { AutoBeAgent } from "@autobe/agent";
import { orchestrateRealizeOperation } from "@autobe/agent/src/orchestrate/realize/orchestrateRealizeOperation";
import { AutoBeRealizeOperationProgrammer } from "@autobe/agent/src/orchestrate/realize/programmers/AutoBeRealizeOperationProgrammer";
import { compileRealizeFiles } from "@autobe/agent/src/orchestrate/realize/programmers/compileRealizeFiles";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeExampleProject,
  AutoBeProgressEventBase,
  AutoBeRealizeAuthorization,
  AutoBeRealizeCollectorFunction,
  AutoBeRealizeOperationFunction,
  AutoBeRealizeTransformerFunction,
  AutoBeRealizeValidateEvent,
} from "@autobe/interface";

export const validate_realize_operation = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<AutoBeRealizeOperationFunction[]> => {
  const progress = (): AutoBeProgressEventBase => ({
    total: 0,
    completed: 0,
  });
  const authorizations: AutoBeRealizeAuthorization[] =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "realize.authorization.json",
    })) ?? [];
  const collectors: AutoBeRealizeCollectorFunction[] =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "realize.collector.json",
    })) ?? [];
  const transformers: AutoBeRealizeTransformerFunction[] =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "realize.transformer.json",
    })) ?? [];
  const operations: AutoBeRealizeOperationFunction[] =
    await orchestrateRealizeOperation(props.agent.getContext(), {
      authorizations,
      collectors,
      transformers,
      writeProgress: progress(),
      correctProgress: progress(),
    });
  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["realize.operation.json"]: JSON.stringify(operations),
    },
  });
  const compiled: AutoBeRealizeValidateEvent = await compileRealizeFiles(
    props.agent.getContext(),
    {
      functions: [...collectors, ...transformers, ...operations],
      additional: AutoBeRealizeOperationProgrammer.getAdditional({
        authorizations,
        collectors,
        transformers,
      }),
    },
  );
  if (compiled.result.type === "failure") {
    console.log(JSON.stringify(compiled.result.diagnostics, null, 2));
  }
  return operations;
};
