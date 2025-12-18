import { IAgenticaController } from "@agentica/core";
import {
  AutoBeAnalyzeReviewEvent,
  AutoBeAnalyzeScenarioEvent,
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
import { transformAnalyzeReviewHistories } from "./histories/transformAnalyzeReviewHistories";
import { IAutoBeAnalyzeReviewApplication } from "./structures/IAutoBeAnalyzeReviewApplication";

export const orchestrateAnalyzeReview = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    allFiles: AutoBeAnalyzeFile[];
    myFile: AutoBeAnalyzeFile;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<AutoBeAnalyzeReviewEvent> => {
  const preliminary: AutoBePreliminaryController<
    "analysisFiles" | "previousAnalysisFiles"
  > = new AutoBePreliminaryController({
    application: typia.json.application<IAutoBeAnalyzeReviewApplication>(),
    source: SOURCE,
    kinds: ["analysisFiles", "previousAnalysisFiles"],
    state: ctx.state(),
    all: {
      analysisFiles: props.allFiles,
    },
    local: {
      analysisFiles: [props.myFile],
    },
  });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeAnalyzeReviewApplication.IComplete | null> =
      {
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
      ...transformAnalyzeReviewHistories(ctx, {
        preliminary,
        scenario: props.scenario,
        myFile: props.myFile,
      }),
    });
    if (pointer.value === null) return out(result)(null);

    const event: AutoBeAnalyzeReviewEvent = {
      type: SOURCE,
      id: v7(),
      file: props.myFile,
      plan: pointer.value.plan,
      review: pointer.value.review,
      content: pointer.value.content,
      tokenUsage: result.tokenUsage,
      metric: result.metric,
      total: props.progress.total,
      completed: ++props.progress.completed,
      step: (ctx.state().analyze?.step ?? -1) + 1,
      created_at: new Date().toISOString(),
    };
    ctx.dispatch(event);
    return out(result)(event);
  });
};

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  pointer: IPointer<IAutoBeAnalyzeReviewApplication.IComplete | null>;
  preliminary: AutoBePreliminaryController<
    "analysisFiles" | "previousAnalysisFiles"
  >;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeAnalyzeReviewApplication.IProps> =
      typia.validate<IAutoBeAnalyzeReviewApplication.IProps>(input);
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
    } satisfies IAutoBeAnalyzeReviewApplication,
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBeAnalyzeReviewApplication, "chatgpt">({
      validate: {
        process: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBeAnalyzeReviewApplication, "claude">({
      validate: {
        process: validate,
      },
    }),
  gemini: (validate: Validator) =>
    typia.llm.application<IAutoBeAnalyzeReviewApplication, "gemini">({
      validate: {
        process: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeAnalyzeReviewApplication.IProps>;

const SOURCE = "analyzeReview" satisfies AutoBeEventSource;
