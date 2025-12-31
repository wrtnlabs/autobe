import { IAgenticaController } from "@agentica/core";
import {
  AutoBeDatabaseComponentEvent,
  AutoBeEventSource,
} from "@autobe/interface";
import { ILlmApplication, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformPrismaComponentsHistory } from "./histories/transformPrismaComponentsHistory";
import { IAutoBeDatabaseComponentApplication } from "./structures/IAutoBeDatabaseComponentApplication";

export async function orchestratePrismaComponents(
  ctx: AutoBeContext,
  instruction: string,
): Promise<AutoBeDatabaseComponentEvent> {
  const start: Date = new Date();
  const prefix: string | null = ctx.state().analyze?.prefix ?? null;
  const preliminary: AutoBePreliminaryController<
    "analysisFiles" | "previousAnalysisFiles" | "previousDatabaseSchemas"
  > = new AutoBePreliminaryController({
    application: typia.json.application<IAutoBeDatabaseComponentApplication>(),
    source: SOURCE,
    kinds: [
      "analysisFiles",
      "previousAnalysisFiles",
      "previousDatabaseSchemas",
    ],
    state: ctx.state(),
    all: {
      analysisFiles: ctx.state().analyze?.files ?? [],
    },
    local: {
      analysisFiles: [],
    },
  });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeDatabaseComponentApplication.IComplete | null> =
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
      ...transformPrismaComponentsHistory(ctx.state(), {
        instruction,
        prefix,
        preliminary,
      }),
    });
    if (pointer.value === null) return out(result)(null);

    const event: AutoBeDatabaseComponentEvent = {
      type: SOURCE,
      id: v7(),
      created_at: start.toISOString(),
      thinking: pointer.value.thinking,
      review: pointer.value.review,
      decision: pointer.value.decision,
      components: pointer.value.components,
      metric: result.metric,
      tokenUsage: result.tokenUsage,
      step: ctx.state().analyze?.step ?? 0,
    };
    return out(result)(event);
  });
}

function createController(props: {
  pointer: IPointer<IAutoBeDatabaseComponentApplication.IComplete | null>;
  preliminary: AutoBePreliminaryController<
    "analysisFiles" | "previousAnalysisFiles" | "previousDatabaseSchemas"
  >;
}): IAgenticaController.IClass {
  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeDatabaseComponentApplication.IProps> =
      typia.validate<IAutoBeDatabaseComponentApplication.IProps>(input);
    if (result.success === false || result.data.request.type === "complete")
      return result;
    return props.preliminary.validate({
      thinking: result.data.thinking,
      request: result.data.request,
    });
  };
  const application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeDatabaseComponentApplication>({
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
    } satisfies IAutoBeDatabaseComponentApplication,
  };
}

type Validator = (
  input: unknown,
) => IValidation<IAutoBeDatabaseComponentApplication.IProps>;

const SOURCE = "databaseComponent" satisfies AutoBeEventSource;
