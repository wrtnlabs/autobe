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
import { transformAnalyzeScenarioHistory } from "./histories/transformAnalyzeScenarioHistory";
import { buildFixedAnalyzeScenarioFiles } from "./structures/FixedAnalyzeTemplate";
import { IAutoBeAnalyzeScenarioApplication } from "./structures/IAutoBeAnalyzeScenarioApplication";
import { tryParseStringAsRecord } from "./utils/repairUtils";

export const orchestrateAnalyzeScenario = async (
  ctx: AutoBeContext,
  props?: { feedback?: string },
): Promise<AutoBeAnalyzeScenarioEvent | AutoBeAssistantMessageHistory> => {
  const start: Date = new Date();
  const preliminary: AutoBePreliminaryController<"previousAnalysisSections"> =
    new AutoBePreliminaryController({
      application: typia.json.application<IAutoBeAnalyzeScenarioApplication>(),
      source: SOURCE,
      kinds: ["previousAnalysisSections"],
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
      ...transformAnalyzeScenarioHistory(ctx, preliminary, props?.feedback),
    });
    if (result.histories.at(-1)?.type === "assistantMessage")
      return out(result)({
        ...(result.histories.at(-1)! as AgenticaAssistantMessageHistory),
        created_at: start.toISOString(),
        completed_at: new Date().toISOString(),
        id: v7(),
      } satisfies AutoBeAssistantMessageHistory);
    else if (pointer.value === null) return out(result)(null);

    const features = pointer.value.features ?? [];
    const event: AutoBeAnalyzeScenarioEvent = {
      type: SOURCE,
      id: v7(),
      prefix: pointer.value.prefix,
      language: pointer.value.language,
      actors: pointer.value.actors,
      entities: pointer.value.entities,
      features: features.map((f) => ({
        id: f.id,
        ...(f.providers ? { providers: f.providers } : {}),
      })),
      files: buildFixedAnalyzeScenarioFiles(
        pointer.value.prefix,
        features,
      ) as AutoBeAnalyzeScenarioEvent["files"],
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
  preliminary: AutoBePreliminaryController<"previousAnalysisSections">;
}): IAgenticaController.IClass {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeAnalyzeScenarioApplication.IProps> => {
    input = repairMissingRequestType(input);
    const result: IValidation<IAutoBeAnalyzeScenarioApplication.IProps> =
      typia.validate<IAutoBeAnalyzeScenarioApplication.IProps>(input);
    if (result.success === false) return result;

    if (result.data.request.type === "complete") return result;

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
  // LLMs (e.g. Qwen) sometimes send `request` as a JSON string
  root.request = tryParseStringAsRecord(root.request);
  if (isRecord(root.request) === false) return input;
  const rawRequest: Record<string, unknown> = root.request;

  const request: Record<string, unknown> =
    normalizeAnalyzeScenarioRequest(rawRequest);
  input = {
    ...root,
    request,
  };
  if (typeof request.type === "string" && request.type.length !== 0)
    return input;

  if (Array.isArray(request.sectionIds) && request.sectionIds.length > 0) {
    return {
      ...root,
      request: {
        ...request,
        type: "getPreviousAnalysisSections",
      },
    };
  }

  if (
    typeof request.reason === "string" &&
    typeof request.prefix === "string" &&
    Array.isArray(request.actors) &&
    Array.isArray(request.entities) &&
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
      features,
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
        features,
      },
    };
  }

  const previousLike =
    typeof input.type === "string" &&
    input.type === "getPreviousAnalysisSections" &&
    input.sectionIds !== undefined;
  if (previousLike) {
    const { thinking, type, sectionIds, ...rest } = input;
    return {
      ...rest,
      ...(thinking !== undefined ? { thinking } : {}),
      request: {
        type,
        sectionIds,
      },
    };
  }
  return input;
};

const normalizeAnalyzeScenarioRequest = (
  input: Record<string, unknown>,
): Record<string, unknown> => {
  const output: Record<string, unknown> = { ...input };

  for (const key of ["actors", "entities", "features", "sectionIds"] as const) {
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
