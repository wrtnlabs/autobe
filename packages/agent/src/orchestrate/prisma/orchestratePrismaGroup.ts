import { IAgenticaController } from "@agentica/core";
import { AutoBeDatabaseGroup, AutoBeEventSource } from "@autobe/interface";
import { IPointer } from "tstl";
import typia, { ILlmApplication, IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformPrismaGroupHistory } from "./histories/transformPrismaGroupHistory";
import { AutoBeDatabaseGroupProgrammer } from "./programmers/AutoBeDatabaseGroupProgrammer";
import { IAutoBeDatabaseGroupApplication } from "./structures/IAutoBeDatabaseGroupApplication";

export async function orchestratePrismaGroup(
  ctx: AutoBeContext,
  instruction: string,
): Promise<AutoBeDatabaseGroup[]> {
  const start: Date = new Date();
  const preliminary: AutoBePreliminaryController<
    "analysisSections" | "previousAnalysisSections" | "previousDatabaseSchemas"
  > = new AutoBePreliminaryController({
    application: typia.json.application<IAutoBeDatabaseGroupApplication>(),
    source: SOURCE,
    kinds: [
      "analysisSections",
      "previousAnalysisSections",
      "previousDatabaseSchemas",
    ],
    state: ctx.state(),
  });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeDatabaseGroupApplication.IComplete | null> =
      {
        value: null,
      };
    const result: AutoBeContext.IResult = await ctx.conversate({
      source: SOURCE,
      controller: createController({
        pointer,
        preliminary,
      }),
      enforceFunctionCall: true,
      ...transformPrismaGroupHistory(ctx.state(), {
        instruction,
        preliminary,
      }),
    });
    if (pointer.value === null) return out(result)(null);

    ctx.dispatch({
      type: SOURCE,
      id: v7(),
      created_at: start.toISOString(),
      analysis: pointer.value.analysis,
      rationale: pointer.value.rationale,
      groups: pointer.value.groups,
      acquisition: preliminary.getAcquisition(),
      metric: result.metric,
      tokenUsage: result.tokenUsage,
      step: ctx.state().analyze?.step ?? 0,
    });
    return out(result)(pointer.value.groups);
  });
}

function createController(props: {
  pointer: IPointer<IAutoBeDatabaseGroupApplication.IComplete | null>;
  preliminary: AutoBePreliminaryController<
    "analysisSections" | "previousAnalysisSections" | "previousDatabaseSchemas"
  >;
}): IAgenticaController.IClass {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeDatabaseGroupApplication.IProps> => {
    const result: IValidation<IAutoBeDatabaseGroupApplication.IProps> =
      typia.validate<IAutoBeDatabaseGroupApplication.IProps>(input);
    if (result.success === false) return result;

    // Preliminary request validation
    if (result.data.request.type !== "complete")
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request: result.data.request,
      });

    // Complete request validation - check group type counts
    const errors: IValidation.IError[] = [];
    AutoBeDatabaseGroupProgrammer.validate({
      errors,
      path: "$input.request.groups",
      groups: result.data.request.groups,
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
    typia.llm.application<IAutoBeDatabaseGroupApplication>({
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
    } satisfies IAutoBeDatabaseGroupApplication,
  };
}

const SOURCE = "databaseGroup" satisfies AutoBeEventSource;
