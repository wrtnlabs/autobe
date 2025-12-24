import {
  AgenticaAssistantMessageHistory,
  IAgenticaController,
} from "@agentica/core";
import {
  AutoBeAnalyzeScenarioEvent,
  AutoBeAssistantMessageHistory,
  AutoBeEventSource,
} from "@autobe/interface";
import { ILlmApplication, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformAnalyzeSceHistories } from "./histories/transformAnalyzeScenarioHistories";
import { IAutoBeAnalyzeScenarioApplication } from "./structures/IAutoBeAnalyzeScenarioApplication";

export const orchestrateAnalyzeScenario = async (
  ctx: AutoBeContext,
): Promise<AutoBeAnalyzeScenarioEvent | AutoBeAssistantMessageHistory> => {
  const start: Date = new Date();
  const preliminary: AutoBePreliminaryController<"previousAnalysisFiles"> =
    new AutoBePreliminaryController({
      application: typia.json.application<IAutoBeAnalyzeScenarioApplication>(),
      source: SOURCE,
      kinds: ["previousAnalysisFiles"],
      state: ctx.state(),
    });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeAnalyzeScenarioApplication.IComplete | null> =
      {
        value: null,
      };
    const result: AutoBeContext.IResult = await ctx.conversate({
      source: SOURCE,
      controller: createController({
        pointer,
        preliminary,
      }),
      enforceFunctionCall: false,
      ...transformAnalyzeSceHistories(ctx, preliminary),
    });
    if (result.histories.at(-1)?.type === "assistantMessage")
      return out(result)({
        ...(result.histories.at(-1)! as AgenticaAssistantMessageHistory),
        created_at: start.toISOString(),
        completed_at: new Date().toISOString(),
        id: v7(),
      } satisfies AutoBeAssistantMessageHistory);
    else if (pointer.value === null) return out(result)(null);

    const event: AutoBeAnalyzeScenarioEvent = {
      type: SOURCE,
      id: v7(),
      prefix: pointer.value.prefix,
      language: pointer.value.language,
      actors: pointer.value.actors,
      files: pointer.value.files,
      metric: result.metric,
      tokenUsage: result.tokenUsage,
      step: (ctx.state().analyze?.step ?? -1) + 1,
      created_at: start.toISOString(),
    };
    return out(result)(event);
  });
};

function createController(props: {
  pointer: IPointer<IAutoBeAnalyzeScenarioApplication.IComplete | null>;
  preliminary: AutoBePreliminaryController<"previousAnalysisFiles">;
}): IAgenticaController.IClass {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeAnalyzeScenarioApplication.IProps> => {
    const result: IValidation<IAutoBeAnalyzeScenarioApplication.IProps> =
      typia.validate<IAutoBeAnalyzeScenarioApplication.IProps>(input);
    if (result.success === false || result.data.request.type === "complete")
      return result;
    return props.preliminary.validate({
      thinking: result.data.thinking,
      request: result.data.request,
    });
  };
  const application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeAnalyzeScenarioApplication>({
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
    } satisfies IAutoBeAnalyzeScenarioApplication,
  };
}

const SOURCE = "analyzeScenario" satisfies AutoBeEventSource;
