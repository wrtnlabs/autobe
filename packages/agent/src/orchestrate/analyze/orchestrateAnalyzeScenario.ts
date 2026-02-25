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

  input = repairFlattenedRequestPayload(input);
  if (isRecord(input) === false) return input;
  const root: Record<string, unknown> = input;
  if (isRecord(root.request) === false) return input;
  const rawRequest: Record<string, unknown> = root.request;

  const request: Record<string, unknown> = normalizeAnalyzeScenarioRequest(
    rawRequest,
  );
  input = {
    ...root,
    request,
  };
  if (typeof request.type === "string" && request.type.length !== 0) return input;

  if (Array.isArray(request.fileNames) && request.fileNames.length > 0) {
    return {
      ...root,
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
      ...root,
      request: {
        ...request,
        type: "complete",
      },
    };
  }
  return input;
};

const repairFlattenedRequestPayload = (
  input: Record<string, unknown>,
): Record<string, unknown> => {
  if (isRecord(input.request)) return input;

  const completeLike =
    typeof input.type === "string" &&
    input.type === "complete" &&
    typeof input.reason === "string" &&
    typeof input.prefix === "string";
  if (completeLike) {
    const {
      thinking,
      type,
      reason,
      prefix,
      actors,
      language,
      entities,
      page,
      files,
      ...rest
    } = input;
    return {
      ...rest,
      ...(thinking !== undefined ? { thinking } : {}),
      request: {
        type,
        reason,
        prefix,
        actors,
        language,
        entities,
        page,
        files,
      },
    };
  }

  const previousLike =
    typeof input.type === "string" &&
    input.type === "getPreviousAnalysisFiles" &&
    input.fileNames !== undefined;
  if (previousLike) {
    const { thinking, type, fileNames, ...rest } = input;
    return {
      ...rest,
      ...(thinking !== undefined ? { thinking } : {}),
      request: {
        type,
        fileNames,
      },
    };
  }
  return input;
};

const normalizeAnalyzeScenarioRequest = (
  input: Record<string, unknown>,
): Record<string, unknown> => {
  const output: Record<string, unknown> = { ...input };

  if (typeof output.page === "string") {
    const page: number = Number(output.page);
    if (Number.isFinite(page)) output.page = page;
  }

  for (const key of ["actors", "entities", "files", "fileNames"] as const) {
    if (typeof output[key] === "string") {
      const parsed: unknown = parseLooseStructuredString(output[key]);
      if (parsed !== undefined) output[key] = parsed;
    }
  }
  return output;
};

const parseLooseStructuredString = (input: string): unknown => {
  const text: string = input.trim();
  if (text.length === 0) return undefined;
  if (
    (text.startsWith("[") === false && text.startsWith("{") === false) ||
    (text.endsWith("]") === false && text.endsWith("}") === false)
  )
    return undefined;

  try {
    return JSON.parse(text);
  } catch {
    // qwen sometimes emits pseudo-JSON with single quotes
    const normalized = text
      .replace(/'/g, '"')
      .replace(/\bNone\b/g, "null")
      .replace(/\bTrue\b/g, "true")
      .replace(/\bFalse\b/g, "false");
    try {
      return JSON.parse(normalized);
    } catch {
      return undefined;
    }
  }
};

const isRecord = (input: unknown): input is Record<string, unknown> =>
  typeof input === "object" && input !== null && Array.isArray(input) === false;
