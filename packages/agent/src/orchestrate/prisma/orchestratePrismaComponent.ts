import { IAgenticaController } from "@agentica/core";
import {
  AutoBeEventSource,
  AutoBePrismaComponentEvent,
} from "@autobe/interface";
import { ILlmApplication, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformPrismaComponentsHistory } from "./histories/transformPrismaComponentsHistory";
import { IAutoBePrismaComponentApplication } from "./structures/IAutoBePrismaComponentApplication";

export async function orchestratePrismaComponents(
  ctx: AutoBeContext,
  instruction: string,
): Promise<AutoBePrismaComponentEvent> {
  const start: Date = new Date();
  const prefix: string | null = ctx.state().analyze?.prefix ?? null;
  const preliminary: AutoBePreliminaryController<
    "analysisFiles" | "previousAnalysisFiles" | "previousPrismaSchemas"
  > = new AutoBePreliminaryController({
    application: typia.json.application<IAutoBePrismaComponentApplication>(),
    source: SOURCE,
    kinds: ["analysisFiles", "previousAnalysisFiles", "previousPrismaSchemas"],
    state: ctx.state(),
    all: {
      analysisFiles: ctx.state().analyze?.files ?? [],
    },
    local: {
      analysisFiles: [],
    },
  });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBePrismaComponentApplication.IComplete | null> =
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

    const event: AutoBePrismaComponentEvent = {
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
  pointer: IPointer<IAutoBePrismaComponentApplication.IComplete | null>;
  preliminary: AutoBePreliminaryController<
    "analysisFiles" | "previousAnalysisFiles" | "previousPrismaSchemas"
  >;
}): IAgenticaController.IClass {
  const validate: Validator = (input) => {
    const result: IValidation<IAutoBePrismaComponentApplication.IProps> =
      typia.validate<IAutoBePrismaComponentApplication.IProps>(input);
    if (result.success === false || result.data.request.type === "complete")
      return result;
    return props.preliminary.validate({
      thinking: result.data.thinking,
      request: result.data.request,
    });
  };
  const application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBePrismaComponentApplication>({
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
    } satisfies IAutoBePrismaComponentApplication,
  };
}

type Validator = (
  input: unknown,
) => IValidation<IAutoBePrismaComponentApplication.IProps>;

const SOURCE = "prismaComponent" satisfies AutoBeEventSource;
