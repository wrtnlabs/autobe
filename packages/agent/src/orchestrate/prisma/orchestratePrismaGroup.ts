import { IAgenticaController } from "@agentica/core";
import { AutoBeDatabaseGroup, AutoBeEventSource } from "@autobe/interface";
import { ILlmApplication, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformPrismaGroupHistory } from "./histories/transformPrismaGroupHistory";
import { IAutoBeDatabaseGroupApplication } from "./structures/IAutoBeDatabaseGroupApplication";

export async function orchestratePrismaGroup(
  ctx: AutoBeContext,
  instruction: string,
): Promise<AutoBeDatabaseGroup[]> {
  const start: Date = new Date();
  const preliminary: AutoBePreliminaryController<
    "analysisFiles" | "previousAnalysisFiles" | "previousDatabaseSchemas"
  > = new AutoBePreliminaryController({
    application: typia.json.application<IAutoBeDatabaseGroupApplication>(),
    source: SOURCE,
    kinds: [
      "analysisFiles",
      "previousAnalysisFiles",
      "previousDatabaseSchemas",
    ],
    state: ctx.state(),
    local: {
      analysisFiles: ctx.state().analyze?.files?.slice(0, 1) ?? [],
    },
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
      groups: pointer.value.groups,
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
    "analysisFiles" | "previousAnalysisFiles" | "previousDatabaseSchemas"
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

    // Complete request validation
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
