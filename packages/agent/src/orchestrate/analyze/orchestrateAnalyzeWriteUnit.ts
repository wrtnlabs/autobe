import { IAgenticaController } from "@agentica/core";
import {
  AutoBeAnalyze,
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeWriteModuleEvent,
  AutoBeAnalyzeWriteUnitEvent,
  AutoBeEventSource,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { IPointer, Singleton } from "tstl";
import typia, { ILlmApplication, IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { validateUnitSectionContent } from "../../utils/validateEnglishOnly";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformAnalyzeWriteUnitHistory } from "./histories/transformAnalyzeWriteUnitHistory";
import {
  IAutoBeAnalyzeWriteUnitApplication,
  IAutoBeAnalyzeWriteUnitApplicationProps,
  IAutoBeAnalyzeWriteUnitApplicationWrite,
} from "./structures/IAutoBeAnalyzeWriteUnitApplication";

export const orchestrateAnalyzeWriteUnit = async (
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    file: AutoBeAnalyze.IFileScenario;
    moduleEvent: AutoBeAnalyzeWriteModuleEvent;
    moduleIndex: number;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
    feedback?: string;
    retry: number;
  },
): Promise<AutoBeAnalyzeWriteUnitEvent> => {
  const counter = new Singleton(() => ++props.progress.completed);
  const preliminary: AutoBePreliminaryController<"previousAnalysisSections"> =
    new AutoBePreliminaryController({
      application: typia.json.application<IAutoBeAnalyzeWriteUnitApplication>(),
      source: SOURCE,
      kinds: ["previousAnalysisSections"],
      state: ctx.state(),
      dispatch: (e) => ctx.dispatch(e),
    });

  const event: AutoBeAnalyzeWriteUnitEvent = await preliminary.orchestrate(
    ctx,
    async (out) => {
      const pointer: IPointer<IAutoBeAnalyzeWriteUnitApplicationWrite | null> =
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
        promptCacheKey: props.promptCacheKey,
        ...transformAnalyzeWriteUnitHistory(ctx, {
          scenario: props.scenario,
          file: props.file,
          moduleEvent: props.moduleEvent,
          moduleIndex: props.moduleIndex,
          feedback: props.feedback,
          preliminary,
        }),
      });
      if (pointer.value === null) return out(result)(null);

      const event: AutoBeAnalyzeWriteUnitEvent = {
        type: SOURCE,
        id: v7(),
        moduleIndex: pointer.value.moduleIndex,
        unitSections: pointer.value.unitSections,
        acquisition: preliminary.getAcquisition(),
        tokenUsage: result.tokenUsage,
        metric: result.metric,
        step: (ctx.state().analyze?.step ?? -1) + 1,
        total: props.progress.total,
        completed: counter.get(),
        retry: props.retry,
        created_at: new Date().toISOString(),
      };
      return out(result)(event);
    },
  );
  ctx.dispatch(event);
  return event;
};

function createController(props: {
  pointer: IPointer<IAutoBeAnalyzeWriteUnitApplicationWrite | null>;
  preliminary: AutoBePreliminaryController<"previousAnalysisSections">;
}): IAgenticaController.IClass {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeAnalyzeWriteUnitApplicationProps> => {
    const result: IValidation<IAutoBeAnalyzeWriteUnitApplicationProps> =
      typia.validate<IAutoBeAnalyzeWriteUnitApplicationProps>(input);
    if (result.success === false) return result;

    // Validate English-only content for complete requests
    if (result.data.request.type === "write") {
      const englishValidation = validateUnitSectionContent(
        result.data.request.unitSections,
      );
      if (!englishValidation.valid) {
        return {
          success: false,
          errors: englishValidation.errors.map((error) => ({
            path: "$input.request.unitSections",
            expected: "English-only content (no Chinese, Korean, Japanese)",
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
    typia.llm.application<IAutoBeAnalyzeWriteUnitApplication>({
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
    } satisfies IAutoBeAnalyzeWriteUnitApplication,
  };
}

const SOURCE = "analyzeWriteUnit" satisfies AutoBeEventSource;
