import {
  AutoBeEventSource,
  AutoBeInterfaceEndpointDesign,
  AutoBeInterfaceEndpointReviewEvent,
  AutoBeInterfaceEndpointRevise,
  AutoBeInterfaceGroup,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { ILlmApplication, ILlmController, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeOrchestrateHistory } from "../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { IAutoBeInterfaceEndpointReviewApplication } from "./structures/IAutoBeInterfaceEndpointReviewApplication";

interface IProgrammer {
  kind: AutoBeInterfaceEndpointReviewEvent["kind"];
  history(next: {
    preliminary: AutoBePreliminaryController<
      | "analysisFiles"
      | "databaseSchemas"
      | "previousAnalysisFiles"
      | "previousDatabaseSchemas"
      | "previousInterfaceOperations"
    >;
    group: AutoBeInterfaceGroup;
    designs: AutoBeInterfaceEndpointDesign[];
  }): IAutoBeOrchestrateHistory;
}

export const orchestrateInterfaceEndpointReview = async (
  ctx: AutoBeContext,
  props: {
    programmer: IProgrammer;
    group: AutoBeInterfaceGroup;
    designs: AutoBeInterfaceEndpointDesign[];
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<AutoBeInterfaceEndpointRevise[]> => {
  const pointer: IPointer<IAutoBeInterfaceEndpointReviewApplication.IComplete | null> =
    { value: null };
  const preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "databaseSchemas"
    | "previousAnalysisFiles"
    | "previousDatabaseSchemas"
    | "previousInterfaceOperations"
  > = new AutoBePreliminaryController({
    application:
      typia.json.application<IAutoBeInterfaceEndpointReviewApplication>(),
    source: SOURCE,
    kinds: [
      "analysisFiles",
      "databaseSchemas",
      "previousAnalysisFiles",
      "previousDatabaseSchemas",
      "previousInterfaceOperations",
    ],
    state: ctx.state(),
    local: {
      analysisFiles: ctx.state().analyze?.files ?? [],
      databaseSchemas:
        ctx
          .state()
          .database?.result.data.files.map((f) => f.models)
          .flat() ?? [],
    },
  });
  return await preliminary.orchestrate(ctx, async (out) => {
    const result: AutoBeContext.IResult = await ctx.conversate({
      source: SOURCE,
      controller: createController({
        preliminary,
        build: (next) => {
          pointer.value = next;
        },
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...props.programmer.history({
        group: props.group,
        designs: props.designs,
        preliminary,
      }),
    });
    if (pointer.value === null) return out(result)(null);

    ctx.dispatch({
      id: v7(),
      type: SOURCE,
      kind: props.programmer.kind,
      group: props.group.name,
      designs: props.designs,
      revises: pointer.value.revises,
      created_at: new Date().toISOString(),
      step: ctx.state().analyze?.step ?? 0,
      completed: ++props.progress.completed,
      total: props.progress.total,
      metric: result.metric,
      tokenUsage: result.tokenUsage,
    } satisfies AutoBeInterfaceEndpointReviewEvent);
    return out(result)(pointer.value.revises);
  });
};

const createController = (props: {
  preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "databaseSchemas"
    | "previousAnalysisFiles"
    | "previousDatabaseSchemas"
    | "previousInterfaceOperations"
  >;
  build: (next: IAutoBeInterfaceEndpointReviewApplication.IComplete) => void;
}): ILlmController => {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeInterfaceEndpointReviewApplication.IProps> => {
    const result =
      typia.validate<IAutoBeInterfaceEndpointReviewApplication.IProps>(input);
    if (result.success === false) return result;
    const request = result.data.request;
    if (request.type === "complete") return result;

    return props.preliminary.validate({
      thinking: result.data.thinking,
      request,
    });
  };

  const application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeInterfaceEndpointReviewApplication>({
      validate: {
        process: validate,
      },
    }),
  );

  return {
    protocol: "class",
    name: SOURCE,
    application,
    execute: {
      process: (next) => {
        if (next.request.type === "complete") props.build(next.request);
      },
    } satisfies IAutoBeInterfaceEndpointReviewApplication,
  };
};

const SOURCE = "interfaceEndpointReview" satisfies AutoBeEventSource;
