import {
  AutoBeAnalyzeActor,
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
import { AutoBeInterfaceEndpointProgrammer } from "./programmers/AutoBeInterfaceEndpointProgrammer";
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
        actors: ctx.state().analyze?.actors ?? [],
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
    pointer.value.revises.forEach((r) => {
      const design: AutoBeInterfaceEndpointDesign | null =
        r.type === "create" ? r.design : r.type === "update" ? r.updated : null;
      if (design === null) return null;
      AutoBeInterfaceEndpointProgrammer.fixDesign({
        design,
      });
    });

    // Filter authorization actors and exclude auth-generated endpoints
    const actors: AutoBeAnalyzeActor[] = ctx.state().analyze?.actors ?? [];
    const revises: AutoBeInterfaceEndpointRevise[] =
      pointer.value.revises.filter((r) =>
        r.type === "create"
          ? AutoBeInterfaceEndpointProgrammer.filter({
              kind: props.programmer.kind,
              design: r.design,
              actors,
            })
          : r.type === "update"
            ? AutoBeInterfaceEndpointProgrammer.filter({
                kind: props.programmer.kind,
                design: r.updated,
                actors,
              })
            : true,
      );

    ctx.dispatch({
      id: v7(),
      type: SOURCE,
      kind: props.programmer.kind,
      group: props.group.name,
      designs: props.designs,
      review: pointer.value.review,
      revises,
      created_at: new Date().toISOString(),
      step: ctx.state().analyze?.step ?? 0,
      completed: ++props.progress.completed,
      total: props.progress.total,
      metric: result.metric,
      tokenUsage: result.tokenUsage,
    } satisfies AutoBeInterfaceEndpointReviewEvent);
    return out(result)(revises);
  });
};

const createController = (props: {
  actors: AutoBeAnalyzeActor[];
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
    if (request.type !== "complete")
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request,
      });

    const revises = request.revises;
    const errors: IValidation.IError[] = [];

    if (props.actors.length === 0)
      revises.forEach((r) => {
        if (r.type === "create") r.design.authorizationActors = [];
        else if (r.type === "update") r.updated.authorizationActors = [];
      });
    revises.forEach((r, i) => {
      if (r.type === "erase") return;
      const design = r.type === "create" ? r.design : r.updated;
      if (
        props.actors.length !== 0 &&
        design.authorizationActors.length !== 0
      ) {
        AutoBeInterfaceEndpointProgrammer.validateDesign({
          actors: props.actors,
          design: r.type === "create" ? r.design : r.updated,
          errors,
          path: `$input.request.revises[${i}]`,
        });
      }
    });
    if (errors.length !== 0)
      return {
        success: false,
        errors,
        data: input,
      };
    return result;
  };

  const application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeInterfaceEndpointReviewApplication>({
      validate: {
        process: validate,
      },
    }),
  );
  AutoBeInterfaceEndpointProgrammer.fixApplication({
    application,
    actors: props.actors,
  });

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
