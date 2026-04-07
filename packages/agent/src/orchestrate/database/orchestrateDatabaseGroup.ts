import { IAgenticaController } from "@agentica/core";
import {
  AutoBeDatabaseGroup,
  AutoBeDatabaseGroupEvent,
  AutoBeEventSource,
} from "@autobe/interface";
import { IPointer } from "tstl";
import typia, { ILlmApplication, IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformDatabaseGroupHistory } from "./histories/transformDatabaseGroupHistory";
import { AutoBeDatabaseGroupProgrammer } from "./programmers/AutoBeDatabaseGroupProgrammer";
import { IAutoBeDatabaseGroupApplication } from "./structures/IAutoBeDatabaseGroupApplication";

export async function orchestrateDatabaseGroup(
  ctx: AutoBeContext,
  instruction: string,
): Promise<AutoBeDatabaseGroup[]> {
  const start: Date = new Date();
  const preliminary: AutoBePreliminaryController<
    | "analysisSections"
    | "previousAnalysisSections"
    | "previousDatabaseSchemas"
    | "complete"
  > = new AutoBePreliminaryController({
    dispatch: (e) => ctx.dispatch(e),
    application: typia.json.application<IAutoBeDatabaseGroupApplication>(),
    source: SOURCE,
    kinds: [
      "analysisSections",
      "previousAnalysisSections",
      "previousDatabaseSchemas",
      "complete",
    ],
    state: ctx.state(),
  });
  const event: AutoBeDatabaseGroupEvent = await preliminary.orchestrate(
    ctx,
    async (out) => {
      const pointer: IPointer<IAutoBeDatabaseGroupApplication.IWrite | null> = {
        value: null,
      };
      const result: AutoBeContext.IResult = await ctx.conversate({
        source: SOURCE,
        controller: createController({
          pointer,
          preliminary,
        }),
        enforceFunctionCall: true,
        ...transformDatabaseGroupHistory(ctx.state(), {
          instruction,
          preliminary,
        }),
      });
      if (pointer.value === null) return out(result)(null);

      return out(result)({
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
    },
  );
  ctx.dispatch(event);
  return event.groups;
}

function createController(props: {
  pointer: IPointer<IAutoBeDatabaseGroupApplication.IWrite | null>;
  preliminary: AutoBePreliminaryController<
    | "analysisSections"
    | "previousAnalysisSections"
    | "previousDatabaseSchemas"
    | "complete"
  >;
}): IAgenticaController.IClass {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeDatabaseGroupApplication.IProps> => {
    const result: IValidation<IAutoBeDatabaseGroupApplication.IProps> =
      typia.validate<IAutoBeDatabaseGroupApplication.IProps>(input);
    if (result.success === false) return result;

    // Preliminary request validation
    if (result.data.request.type !== "write")
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
        if (input.request.type === "write") props.pointer.value = input.request;
      },
    } satisfies IAutoBeDatabaseGroupApplication,
  };
}

const SOURCE = "databaseGroup" satisfies AutoBeEventSource;
