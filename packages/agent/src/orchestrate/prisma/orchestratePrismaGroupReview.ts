import { IAgenticaController } from "@agentica/core";
import {
  AutoBeDatabaseGroup,
  AutoBeDatabaseGroupReviewEvent,
  AutoBeDatabaseGroupRevise,
  AutoBeEventSource,
} from "@autobe/interface";
import { ILlmApplication, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformPrismaGroupReviewHistory } from "./histories/transformPrismaGroupReviewHistory";
import { AutoBeDatabaseGroupProgrammer } from "./programmers/AutoBeDatabaseGroupProgrammer";
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
    "analysisFiles" | "previousAnalysisFiles" | "previousDatabaseSchemas"
  > = new AutoBePreliminaryController({
    application:
      typia.json.application<IAutoBeDatabaseGroupReviewApplication>(),
    source: SOURCE,
    kinds: [
      "analysisFiles",
      "previousAnalysisFiles",
      "previousDatabaseSchemas",
    ],
    state: ctx.state(),
  });

  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeDatabaseGroupReviewApplication.IComplete | null> =
      { value: null };

    const result: AutoBeContext.IResult = await ctx.conversate({
      source: SOURCE,
      controller: createController({
        pointer,
        preliminary,
        currentGroups: props.groups,
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
    const groupMap = new Map<string, AutoBeDatabaseGroup>(
      props.groups.map((g) => [g.namespace, g]),
    );

    const appliedRevises: AutoBeDatabaseGroupRevise[] = [];
    for (const revise of pointer.value.revises) {
      if (revise.type === "create") {
        if (!groupMap.has(revise.group.namespace)) {
          groupMap.set(revise.group.namespace, revise.group);
          appliedRevises.push(revise);
        }
      } else if (revise.type === "update") {
        if (groupMap.has(revise.original_namespace)) {
          groupMap.delete(revise.original_namespace);
          groupMap.set(revise.group.namespace, revise.group);
          appliedRevises.push(revise);
        }
      } else if (revise.type === "erase") {
        if (groupMap.has(revise.namespace)) {
          groupMap.delete(revise.namespace);
          appliedRevises.push(revise);
        }
      } else {
        revise satisfies never;
      }
    }

    const reviewedGroups: AutoBeDatabaseGroup[] = Array.from(
      groupMap.values(),
    );

    const event: AutoBeDatabaseGroupReviewEvent = {
      type: SOURCE,
      id: v7(),
      created_at: start.toISOString(),
      review: pointer.value.review,
      revises: appliedRevises,
      groups: reviewedGroups,
      metric: result.metric,
      tokenUsage: result.tokenUsage,
      step: ctx.state().analyze?.step ?? 0,
    };
    ctx.dispatch(event);

    return out(result)(reviewedGroups);
  });
}

function createController(props: {
  pointer: IPointer<IAutoBeDatabaseGroupReviewApplication.IComplete | null>;
  preliminary: AutoBePreliminaryController<
    "analysisFiles" | "previousAnalysisFiles" | "previousDatabaseSchemas"
  >;
  currentGroups: AutoBeDatabaseGroup[];
}): IAgenticaController.IClass {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeDatabaseGroupReviewApplication.IProps> => {
    const result: IValidation<IAutoBeDatabaseGroupReviewApplication.IProps> =
      typia.validate<IAutoBeDatabaseGroupReviewApplication.IProps>(input);
    if (result.success === false) return result;

    // Preliminary request validation
    if (result.data.request.type !== "complete")
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request: result.data.request,
      });

    // Complete request validation - simulate applying revises and check kind rules
    const groupMap = new Map<string, AutoBeDatabaseGroup>(
      props.currentGroups.map((g) => [g.namespace, g]),
    );
    for (const revise of result.data.request.revises) {
      if (revise.type === "create") {
        groupMap.set(revise.group.namespace, revise.group);
      } else if (revise.type === "update") {
        groupMap.delete(revise.original_namespace);
        groupMap.set(revise.group.namespace, revise.group);
      } else if (revise.type === "erase") {
        groupMap.delete(revise.namespace);
      }
    }

    const errors: IValidation.IError[] = [];
    AutoBeDatabaseGroupProgrammer.validate({
      errors,
      path: "$input.request.revises (after applying)",
      groups: Array.from(groupMap.values()),
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
        if (input.request.type === "complete")
          props.pointer.value = input.request;
      },
    } satisfies IAutoBeDatabaseGroupReviewApplication,
  };
}

const SOURCE = "databaseGroupReview" satisfies AutoBeEventSource;
