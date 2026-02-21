import {
  AutoBeAnalyzeFile,
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeWriteModuleEvent,
  AutoBeAnalyzeWriteUnitEvent,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

/**
 * Transform histories for batch review of ALL unit sections in a file.
 *
 * This transformer provides context for reviewing all units at once, enabling
 * holistic validation of the entire file's unit structure.
 */
export const transformAnalyzeWriteAllUnitReviewHistory = (
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    file: AutoBeAnalyzeFile.Scenario;
    moduleEvent: AutoBeAnalyzeWriteModuleEvent;
    unitEvents: AutoBeAnalyzeWriteUnitEvent[];
    preliminary: null | AutoBePreliminaryController<"previousAnalysisFiles">;
  },
): IAutoBeOrchestrateHistory => {
  return {
    histories: [
      ...ctx
        .histories()
        .filter(
          (h) => h.type === "userMessage" || h.type === "assistantMessage",
        )
        .map((h) => {
          if (h.type === "userMessage") {
            return {
              ...h,
              contents: h.contents,
            };
          } else {
            return h;
          }
        }),
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.ANALYZE_WRITE_ALL_UNIT_REVIEW,
      },
      ...(props.preliminary?.getHistories() ?? []),
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: StringUtil.trim`
        ## Language

        The language of the document is ${JSON.stringify(props.scenario.language ?? "en-US")}.

        ## Document Structure

        **File**: ${props.file.filename}
        **Title**: ${props.moduleEvent.title}
        **Summary**: ${props.moduleEvent.summary}

        ## Module Sections Overview

        ${props.moduleEvent.moduleSections
          .map(
            (section, index) => `
        ### Module ${index + 1}: ${section.title}
        **Purpose**: ${section.purpose}
        **Content**: ${section.content ?? "No content"}
        `,
          )
          .join("\n")}

        ## All Unit Sections to Review

        Please review ALL unit sections below for the entire file:

        ${props.unitEvents
          .map((unitEvent, moduleIndex) => {
            const moduleSection:
              | AutoBeAnalyzeWriteModuleEvent.IModuleSection
              | undefined = props.moduleEvent.moduleSections[moduleIndex];
            return `
        ---
        ## Module ${moduleIndex + 1}: ${moduleSection?.title ?? "Unknown"}

        ${unitEvent.unitSections
          .map(
            (section, unitIndex) => `
        ### Unit ${moduleIndex + 1}.${unitIndex + 1}: ${section.title}
        **Purpose**: ${section.purpose}
        **Content**: ${section.content}
        **Keywords**: ${section.keywords.join(", ")}
        `,
          )
          .join("\n")}
        `;
          })
          .join("\n")}

        ## Review Criteria

        Please evaluate the ENTIRE file's unit structure:
        1. Do ALL unit sections align with their parent module sections?
        2. Is there consistency across the entire file?
        3. Are all functional areas adequately covered without overlap?
        4. Are section boundaries clear throughout?
        5. Are keywords specific and actionable for section generation?
        6. Is content at appropriate abstraction level?
      `,
      },
    ],
    userMessage:
      "Review ALL unit sections for the entire file and approve or reject as a whole.",
  };
};
