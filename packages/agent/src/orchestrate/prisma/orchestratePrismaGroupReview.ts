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
  const preliminary: AutoBePreliminaryController<
    "analysisSections" | "previousAnalysisSections" | "previousDatabaseSchemas"
  > = new AutoBePreliminaryController({
    dispatch: (e) => ctx.dispatch(e),
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

  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeDatabaseGroupReviewApplication.IWrite | null> =
      { value: null };

    const result: AutoBeContext.IResult = await ctx.conversate({
      source: SOURCE,
      controller: createController({
        pointer,
        preliminary,
        groups: props.groups,
      }),
      enforceFunctionCall: true,
      ...transformPrismaGroupReviewHistory({
        groups: props.groups,
        instruction: props.instruction,
        preliminary,
      }),
    });
    if (pointer.value === null) return out(result)(null);

    // Apply revises to the group list
    const reviewedGroups = AutoBeDatabaseGroupReviewProgrammer.execute({
      groups: props.groups,
      revises: pointer.value.revises,
    });

    const event: AutoBeDatabaseGroupReviewEvent = {
      type: SOURCE,
      id: v7(),
      created_at: start.toISOString(),
      review: pointer.value.review,
      revises: pointer.value.revises,
      groups: reviewedGroups,
      acquisition: preliminary.getAcquisition(),
      metric: result.metric,
      tokenUsage: result.tokenUsage,
      step: ctx.state().analyze?.step ?? 0,
    };
    ctx.dispatch(event);

    return out(result)(reviewedGroups);
  });
}

function createController(props: {
  pointer: IPointer<IAutoBeDatabaseGroupReviewApplication.IWrite | null>;
  preliminary: AutoBePreliminaryController<
    "analysisSections" | "previousAnalysisSections" | "previousDatabaseSchemas"
  >;
  groups: AutoBeDatabaseGroup[];
}): IAgenticaController.IClass {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeDatabaseGroupReviewApplication.IProps> => {
    const result: IValidation<IAutoBeDatabaseGroupReviewApplication.IProps> =
      typia.validate<IAutoBeDatabaseGroupReviewApplication.IProps>(input);
    if (result.success === false) return result;

    // Preliminary request validation
    if (result.data.request.type !== "write")
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request: result.data.request,
      });

    // Complete request validation - validate revises and check kind rules after applying
    const errors: IValidation.IError[] = [];
    AutoBeDatabaseGroupReviewProgrammer.validate({
      errors,
      path: "$input.request.revises",
      groups: props.groups,
      revises: result.data.request.revises,
    });
    if (errors.length > 0)
      return {
        success: false,
        errors,
        data: result.data,
      };
    return result;
  };

  const application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeDatabaseGroupReviewApplication>({
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
      process: (input) => {
        if (input.request.type === "write") props.pointer.value = input.request;
      },
    } satisfies IAutoBeDatabaseGroupReviewApplication,
  };
}

const SOURCE = "databaseGroupReview" satisfies AutoBeEventSource;
