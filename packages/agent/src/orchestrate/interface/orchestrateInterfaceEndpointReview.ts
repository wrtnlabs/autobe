import {
  AutoBeEventSource,
  AutoBeInterfaceEndpointDesign,
  AutoBeInterfaceEndpointReviewEvent,
  AutoBeInterfaceEndpointRevise,
  AutoBeInterfaceGroup,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
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
        actors: ctx.state().analyze?.actors.map((it) => it.name) ?? [],
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

    // Filter out authorization endpoints from revises (login, join, refresh, management)
    // props.designs is already filtered by orchestrateInterfaceEndpointWrite
    const filteredRevises = pointer.value.revises.filter((r) =>
      r.type === "erase"
        ? true
        : r.authorizationType === null || r.authorizationType === "management",
    );

    ctx.dispatch({
      id: v7(),
      type: SOURCE,
      kind: props.programmer.kind,
      group: props.group.name,
      designs: props.designs,
      review: pointer.value.review,
      revises: filteredRevises,
      created_at: new Date().toISOString(),
      step: ctx.state().analyze?.step ?? 0,
      completed: ++props.progress.completed,
      total: props.progress.total,
      metric: result.metric,
      tokenUsage: result.tokenUsage,
    } satisfies AutoBeInterfaceEndpointReviewEvent);
    return out(result)(filteredRevises);
  });
};

const createController = (props: {
  actors: string[];
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
        if (r.type === "create" || r.type === "update")
          r.authorizationActors = [];
      });
    revises.forEach((r, i) => {
      if (r.type !== "create" && r.type !== "update") return;
      if (r.authorizationActors.length !== 0 && props.actors.length !== 0) {
        r.authorizationActors.forEach((actor, j) => {
          if (props.actors.includes(actor) === true) return;
          errors.push({
            path: `$input.request.revises[${i}].authorizationActors[${j}]`,
            expected: `null | ${props.actors.map((str) => JSON.stringify(str)).join(" | ")}`,
            description: StringUtil.trim`
            Actor "${actor}" is not defined in the roles list.

            Please select one of them below, or do not define (\`null\`):

            ${props.actors.map((role) => `- ${role}`).join("\n")}
          `,
            value: actor,
          });
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
