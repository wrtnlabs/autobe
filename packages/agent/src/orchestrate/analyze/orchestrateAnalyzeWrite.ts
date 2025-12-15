import { IAgenticaController } from "@agentica/core";
import {
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeWriteEvent,
  AutoBeEventSource,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { AutoBeAnalyzeFile } from "@autobe/interface/src/histories/contents/AutoBeAnalyzeFile";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformAnalyzeWriteHistories } from "./histories/transformAnalyzeWriteHistories";
import { IAutoBeAnalyzeWriteApplication } from "./structures/IAutoBeAnalyzeWriteApplication";

export const orchestrateAnalyzeWrite = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    file: AutoBeAnalyzeFile.Scenario;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<AutoBeAnalyzeWriteEvent> => {
  const preliminary: AutoBePreliminaryController<"previousAnalysisFiles"> =
    new AutoBePreliminaryController({
      application: typia.json.application<IAutoBeAnalyzeWriteApplication>(),
      source: SOURCE,
      kinds: ["previousAnalysisFiles"],
      state: ctx.state(),
    });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeAnalyzeWriteApplication.IComplete | null> = {
      value: null,
    };
    const result: AutoBeContext.IResult<Model> = await ctx.conversate({
      source: SOURCE,
      controller: createController({
        model: ctx.model,
        pointer,
        preliminary,
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...transformAnalyzeWriteHistories(ctx, {
        scenario: props.scenario,
        file: props.file,
        preliminary,
      }),
    });
    if (pointer.value === null) return out(result)(null);

    const event: AutoBeAnalyzeWriteEvent = {
      type: SOURCE,
      id: v7(),
      file: {
        ...props.file,
        content: pointer.value.content,
      },
      tokenUsage: result.tokenUsage,
      metric: result.metric,
      step: (ctx.state().analyze?.step ?? -1) + 1,
      total: props.progress.total,
      completed: ++props.progress.completed,
      created_at: new Date().toISOString(),
    };
    ctx.dispatch(event);
    return out(result)(event);
  });
};

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  pointer: IPointer<IAutoBeAnalyzeWriteApplication.IComplete | null>;
  preliminary: AutoBePreliminaryController<"previousAnalysisFiles">;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeAnalyzeWriteApplication.IProps> =
      typia.validate<IAutoBeAnalyzeWriteApplication.IProps>(input);
    if (result.success === false || result.data.request.type === "complete")
      return result;
    return props.preliminary.validate({
      thinking: result.data.thinking,
      request: result.data.request,
    });
  };
  const application: ILlmApplication<Model> = props.preliminary.fixApplication(
    collection[
      props.model === "chatgpt"
        ? "chatgpt"
        : props.model === "gemini"
          ? "gemini"
          : "claude"
    ](
      validate,
    ) satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>,
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
    } satisfies IAutoBeAnalyzeWriteApplication,
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBeAnalyzeWriteApplication, "chatgpt">({
      validate: {
        process: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBeAnalyzeWriteApplication, "claude">({
      validate: {
        process: validate,
      },
    }),
  gemini: (validate: Validator) =>
    typia.llm.application<IAutoBeAnalyzeWriteApplication, "gemini">({
      validate: {
        process: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeAnalyzeWriteApplication.IProps>;

const SOURCE = "analyzeWrite" satisfies AutoBeEventSource;
