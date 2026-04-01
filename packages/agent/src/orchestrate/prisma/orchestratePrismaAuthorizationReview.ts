import { IAgenticaController } from "@agentica/core";
import {
  AutoBeAnalyze,
  AutoBeDatabaseAuthorizationReviewEvent,
  AutoBeDatabaseComponent,
  AutoBeEventSource,
} from "@autobe/interface";
import { IPointer } from "tstl";
import typia, { ILlmApplication, IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { AutoBeCyclinicController } from "../common/AutoBeCyclinicController";
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
  const actors: AutoBeAnalyze.IActor[] = ctx.state().analyze?.actors ?? [];

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
    actors: AutoBeAnalyze.IActor[];
    component: AutoBeDatabaseComponent;
    instruction: string;
    prefix: string | null;
  },
): Promise<AutoBeDatabaseAuthorizationReviewEvent> {
  const cyclinic = new AutoBeCyclinicController<
    "analysisSections" | "previousAnalysisSections" | "previousDatabaseSchemas"
  >({
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

  return cyclinic.orchestrate<
    IAutoBeDatabaseAuthorizationReviewApplication.IWrite,
    AutoBeDatabaseAuthorizationReviewEvent
  >(
    ctx,
    // PROCESS: LLM conversation → action
    async (context) => {
      const action: IPointer<
        | {
            type: "write";
            data: IAutoBeDatabaseAuthorizationReviewApplication.IWrite;
          }
        | { type: "complete" }
        | null
      > = { value: null };

      const result: AutoBeContext.IResult = await ctx.conversate({
        source: SOURCE,
        controller: createController({
          cyclinic,
          action,
          prefix: props.prefix,
          actors: props.actors,
          component: props.component,
        }),
        enforceFunctionCall: true,
        ...transformPrismaAuthorizationReviewHistory({
          component: props.component,
          actors: props.actors,
          instruction: props.instruction,
          prefix: props.prefix,
          preliminary: context.preliminary,
        }),
      });
      return { result, action: action.value };
    },
    // VALIDATE: run business logic validation
    async (writeData) => {
      const errors: IValidation.IError[] = [];
      AutoBeDatabaseAuthorizationReviewProgrammer.validate({
        errors,
        prefix: props.prefix,
        revises: writeData.revises,
        path: "$input.request.revises",
        component: props.component,
        actors: props.actors,
      });
      if (errors.length > 0) return { success: false, diagnostics: errors };
      return { success: true };
    },
    // FINALIZE: build result, dispatch event, return
    async (lastWrite, result) => {
      const component: AutoBeDatabaseComponent = {
        kind: props.component.kind,
        filename: props.component.filename,
        namespace: props.component.namespace,
        thinking: props.component.thinking,
        review: lastWrite.review,
        rationale: props.component.rationale,
        tables: AutoBeDatabaseAuthorizationReviewProgrammer.execute({
          component: props.component,
          revises: lastWrite.revises,
          actors: props.actors,
          prefix: props.prefix,
        }),
      };
      const [modification] =
        AutoBeDatabaseComponentProgrammer.removeDuplicatedTable([component]);

      const event: AutoBeDatabaseAuthorizationReviewEvent = {
        type: SOURCE,
        id: v7(),
        created_at: new Date().toISOString(),
        review: modification.review,
        revises: lastWrite.revises,
        modification,
        acquisition: cyclinic.getPreliminary().getAcquisition(),
        metric: result?.metric ?? {
          attempt: 0,
          success: 0,
          consent: 0,
          validationFailure: 0,
          invalidJson: 0,
        },
        tokenUsage: result?.tokenUsage ?? {
          total: 0,
          input: { total: 0, cached: 0 },
          output: {
            total: 0,
            reasoning: 0,
            accepted_prediction: 0,
            rejected_prediction: 0,
          },
        },
        step: ctx.state().analyze?.step ?? 0,
      };
      return event;
    },
  );
}

function createController(props: {
  cyclinic: AutoBeCyclinicController<
    "analysisSections" | "previousAnalysisSections" | "previousDatabaseSchemas"
  >;
  action: IPointer<
    | {
        type: "write";
        data: IAutoBeDatabaseAuthorizationReviewApplication.IWrite;
      }
    | { type: "complete" }
    | null
  >;
  prefix: string | null;
  actors: AutoBeAnalyze.IActor[];
  component: AutoBeDatabaseComponent;
}): IAgenticaController.IClass {
  const preliminary: AutoBePreliminaryController<
    "analysisSections" | "previousAnalysisSections" | "previousDatabaseSchemas"
  > = props.cyclinic.getPreliminary();

  const validate = (
    input: unknown,
  ): IValidation<IAutoBeDatabaseAuthorizationReviewApplication.IProps> => {
    const result: IValidation<IAutoBeDatabaseAuthorizationReviewApplication.IProps> =
      typia.validate<IAutoBeDatabaseAuthorizationReviewApplication.IProps>(
        input,
      );
    if (result.success === false) return result;
    const req = result.data.request;
    if (req.type === "write" || req.type === "complete") return result;
    return preliminary.validate({
      thinking: result.data.thinking,
      request: req,
    });
  };

  const application: ILlmApplication = props.cyclinic.fixCompleteAvailability(
    preliminary.fixApplication(
      typia.llm.application<IAutoBeDatabaseAuthorizationReviewApplication>({
        validate: {
          process: validate,
        },
      }),
    ),
  );

  return {
    protocol: "class",
    name: SOURCE,
    application,
    execute: {
      process: (next) => {
        if (next.request.type === "write")
          props.action.value = { type: "write", data: next.request };
        else if (next.request.type === "complete")
          props.action.value = { type: "complete" };
      },
    } satisfies IAutoBeDatabaseAuthorizationReviewApplication,
  };
}

const SOURCE = "databaseAuthorizationReview" satisfies AutoBeEventSource;
