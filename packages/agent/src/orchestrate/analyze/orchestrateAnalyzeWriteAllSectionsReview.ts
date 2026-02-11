import { IAgenticaController } from "@agentica/core";
import {
  AutoBeAnalyzeFile,
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeWriteModuleEvent,
  AutoBeAnalyzeWriteUnitEvent,
  AutoBeAnalyzeWriteSectionEvent,
  AutoBeEventSource,
  AutoBeProgressEventBase,
  AutoBeAnalyzeWriteAllSectionsReviewEvent,
} from "@autobe/interface";
import { ILlmApplication, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformAnalyzeWriteAllSectionsReviewHistories } from "./histories/transformAnalyzeWriteAllSectionsReviewHistories";
import { IAutoBeAnalyzeWriteAllSectionsReviewApplication } from "./structures/IAutoBeAnalyzeWriteAllSectionsReviewApplication";

/**
 * Orchestrate batch review of ALL section sections for a file.
 *
 * This function reviews all section sections at once in a single LLM call,
 * providing holistic validation of the entire file's detailed content.
 */
export const orchestrateAnalyzeWriteAllSectionsReview = async (
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    file: AutoBeAnalyzeFile.Scenario;
    moduleEvent: AutoBeAnalyzeWriteModuleEvent;
    unitEvents: AutoBeAnalyzeWriteUnitEvent[];
    sectionEvents: AutoBeAnalyzeWriteSectionEvent[][];
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeAnalyzeWriteAllSectionsReviewEvent> => {
  const preliminary: AutoBePreliminaryController<"previousAnalysisFiles"> =
    new AutoBePreliminaryController({
      application:
        typia.json.application<IAutoBeAnalyzeWriteAllSectionsReviewApplication>(),
      source: SOURCE,
      kinds: ["previousAnalysisFiles"],
      state: ctx.state(),
    });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeAnalyzeWriteAllSectionsReviewApplication.IComplete | null> =
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
      ...transformAnalyzeWriteAllSectionsReviewHistories(ctx, {
        scenario: props.scenario,
        file: props.file,
        moduleEvent: props.moduleEvent,
        unitEvents: props.unitEvents,
        sectionEvents: props.sectionEvents,
        preliminary,
      }),
    });
    if (pointer.value === null) return out(result)(null);

    const event: AutoBeAnalyzeWriteAllSectionsReviewEvent = {
      type: SOURCE,
      id: v7(),
      approved: pointer.value.approved,
      feedback: pointer.value.feedback,
      revisedSections: pointer.value.revisedSections,
      tokenUsage: result.tokenUsage,
      metric: result.metric,
      step: (ctx.state().analyze?.step ?? -1) + 1,
      total: props.progress.total,
      completed: props.progress.completed,
      created_at: new Date().toISOString(),
    };
    await ctx.dispatch(event);
    return out(result)(event);
  });
};

function createController(props: {
  pointer: IPointer<IAutoBeAnalyzeWriteAllSectionsReviewApplication.IComplete | null>;
  preliminary: AutoBePreliminaryController<"previousAnalysisFiles">;
}): IAgenticaController.IClass {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeAnalyzeWriteAllSectionsReviewApplication.IProps> => {
    const result: IValidation<IAutoBeAnalyzeWriteAllSectionsReviewApplication.IProps> =
      typia.validate<IAutoBeAnalyzeWriteAllSectionsReviewApplication.IProps>(input);
    if (result.success === false || result.data.request.type === "complete")
      return result;
    return props.preliminary.validate({
      thinking: result.data.thinking,
      request: result.data.request,
    });
  };
  const application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeAnalyzeWriteAllSectionsReviewApplication>({
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
    } satisfies IAutoBeAnalyzeWriteAllSectionsReviewApplication,
  };
}

const SOURCE = "analyzeWriteAllSectionsReview" satisfies AutoBeEventSource;
