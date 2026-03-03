import { IAgenticaController } from "@agentica/core";
import {
  AutoBeAnalyzeActor,
  AutoBeDatabaseAuthorizationReviewEvent,
  AutoBeDatabaseComponent,
  AutoBeEventSource,
} from "@autobe/interface";
import { ILlmApplication, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformPrismaAuthorizationReviewHistory } from "./histories/transformPrismaAuthorizationReviewHistory";
import { AutoBeDatabaseAuthorizationReviewProgrammer } from "./programmers/AutoBeDatabaseAuthorizationReviewProgrammer";
import { AutoBeDatabaseComponentProgrammer } from "./programmers/AutoBeDatabaseComponentProgrammer";
import { IAutoBeDatabaseAuthorizationReviewApplication } from "./structures/IAutoBeDatabaseAuthorizationReviewApplication";

export async function orchestratePrismaAuthorizationReview(
  ctx: AutoBeContext,
  props: {
    instruction: string;
    component: AutoBeDatabaseComponent;
  },
): Promise<AutoBeDatabaseComponent> {
  const prefix: string | null = ctx.state().analyze?.prefix ?? null;
  const actors: AutoBeAnalyzeActor[] = ctx.state().analyze?.actors ?? [];

  const event: AutoBeDatabaseAuthorizationReviewEvent = await process(ctx, {
    component: props.component,
    actors,
    instruction: props.instruction,
    prefix,
  });
  ctx.dispatch(event);
  return event.modification;
}

async function process(
  ctx: AutoBeContext,
  props: {
    actors: AutoBeAnalyzeActor[];
    component: AutoBeDatabaseComponent;
    instruction: string;
    prefix: string | null;
  },
): Promise<AutoBeDatabaseAuthorizationReviewEvent> {
  const preliminary: AutoBePreliminaryController<
    "analysisSections" | "previousAnalysisSections" | "previousDatabaseSchemas"
  > = new AutoBePreliminaryController({
    application:
      typia.json.application<IAutoBeDatabaseAuthorizationReviewApplication>(),
    source: SOURCE,
    kinds: [
      "analysisSections",
      "previousAnalysisSections",
      "previousDatabaseSchemas",
    ],
    state: ctx.state(),
  });

  return preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeDatabaseAuthorizationReviewApplication.IComplete | null> =
      { value: null };

    const result: AutoBeContext.IResult = await ctx.conversate({
      source: SOURCE,
      controller: createController({
        preliminary,
        prefix: props.prefix,
        actors: props.actors,
        component: props.component,
        build: (next) => {
          pointer.value = next;
        },
      }),
      enforceFunctionCall: true,
      ...transformPrismaAuthorizationReviewHistory({
        component: props.component,
        actors: props.actors,
        instruction: props.instruction,
        prefix: props.prefix,
        preliminary,
      }),
    });
    if (pointer.value === null) return out(result)(null);

    const component: AutoBeDatabaseComponent = {
      kind: props.component.kind,
      filename: props.component.filename,
      namespace: props.component.namespace,
      thinking: props.component.thinking,
      review: pointer.value.review,
      rationale: props.component.rationale,
      tables: AutoBeDatabaseAuthorizationReviewProgrammer.execute({
        component: props.component,
        revises: pointer.value.revises,
        actors: props.actors,
        prefix: props.prefix,
      }),
    };
    const [modification] =
      AutoBeDatabaseComponentProgrammer.removeDuplicatedTable([component]);

    return out(result)({
      type: SOURCE,
      id: v7(),
      created_at: new Date().toISOString(),
      review: modification.review,
      revises: pointer.value.revises,
      modification,
      acquisition: preliminary.getAcquisition(),
      metric: result.metric,
      tokenUsage: result.tokenUsage,
      step: ctx.state().analyze?.step ?? 0,
    });
  });
}

function createController(props: {
  preliminary: AutoBePreliminaryController<
    "analysisSections" | "previousAnalysisSections" | "previousDatabaseSchemas"
  >;
  prefix: string | null;
  actors: AutoBeAnalyzeActor[];
  component: AutoBeDatabaseComponent;
  build: (
    next: IAutoBeDatabaseAuthorizationReviewApplication.IComplete,
  ) => void;
}): IAgenticaController.IClass {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeDatabaseAuthorizationReviewApplication.IProps> => {
    const result: IValidation<IAutoBeDatabaseAuthorizationReviewApplication.IProps> =
      typia.validate<IAutoBeDatabaseAuthorizationReviewApplication.IProps>(
        input,
      );
    if (result.success === false) return result;
    else if (result.data.request.type !== "complete")
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request: result.data.request,
      });

    const errors: IValidation.IError[] = [];
    AutoBeDatabaseAuthorizationReviewProgrammer.validate({
      errors,
      prefix: props.prefix,
      revises: result.data.request.revises,
      path: "$input.request.revises",
      component: props.component,
      actors: props.actors,
    });
    if (errors.length > 0)
      return {
        success: false,
        data: result.data,
        errors,
      };
    return result;
  };

  const application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeDatabaseAuthorizationReviewApplication>({
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
    } satisfies IAutoBeDatabaseAuthorizationReviewApplication,
  };
}

const SOURCE = "databaseAuthorizationReview" satisfies AutoBeEventSource;
