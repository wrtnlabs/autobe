import { IAgenticaController } from "@agentica/core";
import {
  AutoBeAnalyze,
  AutoBeAnalyzeWriteSectionEvent,
  AutoBeEventSource,
} from "@autobe/interface";
import { IPointer } from "tstl";
import typia, { ILlmApplication } from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { transformAnalyzeExtractDecisionsHistory } from "./histories/transformAnalyzeExtractDecisionsHistory";
import { IAutoBeAnalyzeExtractDecisionsApplication } from "./structures/IAutoBeAnalyzeExtractDecisionsApplication";
import { IFileDecisions } from "./utils/detectDecisionConflicts";

/**
 * Extract key decisions from a single file's section content.
 *
 * This orchestrator calls the LLM to read one file's full section content and
 * extract binary/discrete decisions as structured data. The extracted decisions
 * are then used for programmatic cross-file contradiction detection.
 *
 * Called in parallel for each file (excluding 00-toc.md) after per-file review
 * approves.
 */
export const orchestrateAnalyzeExtractDecisions = async (
  ctx: AutoBeContext,
  props: {
    file: AutoBeAnalyze.IFileScenario;
    sectionEvents: AutoBeAnalyzeWriteSectionEvent[][];
  },
): Promise<IFileDecisions> => {
  const pointer: IPointer<IAutoBeAnalyzeExtractDecisionsApplication.IProps | null> =
    {
      value: null,
    };

  await ctx.conversate({
    source: SOURCE,
    controller: createController({ pointer }),
    enforceFunctionCall: true,
    ...transformAnalyzeExtractDecisionsHistory(ctx, {
      file: props.file,
      sectionEvents: props.sectionEvents,
    }),
  });

  return {
    filename: props.file.filename,
    decisions: (pointer.value?.decisions ?? []).map((d) => ({
      topic: d.topic,
      decision: d.decision,
      value: d.value,
      evidence: d.evidence,
    })),
  };
};

function createController(props: {
  pointer: IPointer<IAutoBeAnalyzeExtractDecisionsApplication.IProps | null>;
}): IAgenticaController.IClass {
  const application: ILlmApplication =
    typia.llm.application<IAutoBeAnalyzeExtractDecisionsApplication>();
  return {
    protocol: "class",
    name: SOURCE,
    application,
    execute: {
      process: (input) => {
        props.pointer.value = input;
      },
    } satisfies IAutoBeAnalyzeExtractDecisionsApplication,
  };
}

const SOURCE = "analyzeSectionReview" satisfies AutoBeEventSource;
