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
import { validateScenarioFileNames } from "../../utils/validateEnglishOnly";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformAnalyzeScenarioHistory } from "./histories/transformAnalyzeScenarioHistory";
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
      ...transformAnalyzeScenarioHistory(ctx, preliminary),
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
      entities: pointer.value.entities,
      files: pointer.value.files,
      acquisition: preliminary.getAcquisition(),
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
    input = repairMissingRequestType(input);
    const result: IValidation<IAutoBeAnalyzeScenarioApplication.IProps> =
      typia.validate<IAutoBeAnalyzeScenarioApplication.IProps>(input);
    if (result.success === false) return result;

    // Validate file naming for complete requests
    if (result.data.request.type === "complete") {
      const fileNameValidation = validateScenarioFileNames(
        result.data.request.files,
      );
      if (!fileNameValidation.valid) {
        return {
          success: false,
          errors: fileNameValidation.errors.map((error) => ({
            path: "$input.request.files",
            expected:
              "Sequential file names (00-toc.md, 01-xxx.md, 02-xxx.md, ...)",
            value: error,
          })),
          data: result.data,
        };
      }
      return result;
    }

    return props.preliminary.validate({
      thinking: result.data.thinking ?? "",
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

const repairMissingRequestType = (input: unknown): unknown => {
  if (isRecord(input) === false) return input;
  if (isRecord(input.request) === false) return input;

  const request: Record<string, unknown> = input.request;
  if (typeof request.type === "string" && request.type.length !== 0) return input;

  if (Array.isArray(request.fileNames) && request.fileNames.length > 0) {
    return {
      ...input,
      request: {
        ...request,
        type: "getPreviousAnalysisFiles",
      },
    };
  }

  if (
    typeof request.reason === "string" &&
    typeof request.prefix === "string" &&
    Array.isArray(request.actors) &&
    Array.isArray(request.entities) &&
    Array.isArray(request.files) &&
    typeof request.page === "number" &&
    Object.prototype.hasOwnProperty.call(request, "language")
  ) {
    return {
      ...input,
      request: {
        ...request,
        type: "complete",
      },
    };
  }
  return input;
};

const isRecord = (input: unknown): input is Record<string, unknown> =>
  typeof input === "object" && input !== null && Array.isArray(input) === false;
