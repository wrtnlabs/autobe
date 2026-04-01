import { IAgenticaController } from "@agentica/core";
import {
  AutoBeDatabaseGroup,
  AutoBeDatabaseGroupReviewEvent,
  AutoBeEventSource,
} from "@autobe/interface";
import { IPointer } from "tstl";
import typia, { ILlmApplication, IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { AutoBeCyclinicController } from "../common/AutoBeCyclinicController";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformPrismaGroupReviewHistory } from "./histories/transformPrismaGroupReviewHistory";
import { AutoBeDatabaseGroupReviewProgrammer } from "./programmers/AutoBeDatabaseGroupReviewProgrammer";
import { IAutoBeDatabaseGroupReviewApplication } from "./structures/IAutoBeDatabaseGroupReviewApplication";

export async function orchestratePrismaGroupReview(
  ctx: AutoBeContext,
  props: {
    instruction: string;
    groups: AutoBeDatabaseGroup[];
  },
): Promise<AutoBeDatabaseGroup[]> {
  const start: Date = new Date();

  const cyclinic = new AutoBeCyclinicController<
    "analysisSections" | "previousAnalysisSections" | "previousDatabaseSchemas"
  >({
    application:
      typia.json.application<IAutoBeDatabaseGroupReviewApplication>(),
    source: SOURCE,
    kinds: [
      "analysisSections",
      "previousAnalysisSections",
      "previousDatabaseSchemas",
    ],
    state: ctx.state(),
  });

  return cyclinic.orchestrate<
    IAutoBeDatabaseGroupReviewApplication.IWrite,
    AutoBeDatabaseGroup[]
  >(
    ctx,
    // PROCESS: LLM conversation → action
    async (context) => {
      const action: IPointer<
        | {
            type: "write";
            data: IAutoBeDatabaseGroupReviewApplication.IWrite;
          }
        | { type: "complete" }
        | null
      > = { value: null };

      const result: AutoBeContext.IResult = await ctx.conversate({
        source: SOURCE,
        controller: createController({
          action,
          cyclinic,
          groups: props.groups,
        }),
        enforceFunctionCall: true,
        ...transformPrismaGroupReviewHistory({
          groups: props.groups,
          instruction: props.instruction,
          preliminary: context.preliminary,
        }),
      });
      return { result, action: action.value };
    },
    // VALIDATE: run business logic validation
    async (writeData) => {
      const errors: IValidation.IError[] = [];
      AutoBeDatabaseGroupReviewProgrammer.validate({
        errors,
        path: "$input.request.revises",
        groups: props.groups,
        revises: writeData.revises,
      });
      if (errors.length > 0) return { success: false, diagnostics: errors };
      return { success: true };
    },
    // FINALIZE: build result, dispatch event, return
    async (lastWrite, result) => {
      // Apply revises to the group list
      const reviewedGroups = AutoBeDatabaseGroupReviewProgrammer.execute({
        groups: props.groups,
        revises: lastWrite.revises,
      });

      const event: AutoBeDatabaseGroupReviewEvent = {
        type: SOURCE,
        id: v7(),
        created_at: start.toISOString(),
        review: lastWrite.review,
        revises: lastWrite.revises,
        groups: reviewedGroups,
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
      if (result !== null) ctx.dispatch(event);
      return reviewedGroups;
    },
  );
}

function createController(props: {
  action: IPointer<
    | {
        type: "write";
        data: IAutoBeDatabaseGroupReviewApplication.IWrite;
      }
    | { type: "complete" }
    | null
  >;
  cyclinic: AutoBeCyclinicController<
    "analysisSections" | "previousAnalysisSections" | "previousDatabaseSchemas"
  >;
  groups: AutoBeDatabaseGroup[];
}): IAgenticaController.IClass {
  const preliminary: AutoBePreliminaryController<
    "analysisSections" | "previousAnalysisSections" | "previousDatabaseSchemas"
  > = props.cyclinic.getPreliminary();

  const validate = (
    input: unknown,
  ): IValidation<IAutoBeDatabaseGroupReviewApplication.IProps> => {
    const result: IValidation<IAutoBeDatabaseGroupReviewApplication.IProps> =
      typia.validate<IAutoBeDatabaseGroupReviewApplication.IProps>(input);
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
      typia.llm.application<IAutoBeDatabaseGroupReviewApplication>({
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
      process: (input) => {
        if (input.request.type === "write")
          props.action.value = { type: "write", data: input.request };
        else if (input.request.type === "complete")
          props.action.value = { type: "complete" };
      },
    } satisfies IAutoBeDatabaseGroupReviewApplication,
  };
}

const SOURCE = "databaseGroupReview" satisfies AutoBeEventSource;
