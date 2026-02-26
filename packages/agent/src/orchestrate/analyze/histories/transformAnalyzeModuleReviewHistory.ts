import {
  AutoBeAnalyzeFile,
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeWriteModuleEvent,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

/**
 * Transform histories for cross-file review of module sections across ALL
 * files.
 *
 * This transformer provides context for reviewing all files' module structures
 * together, enabling cross-file validation for consistency and uniformity.
 */
export const transformAnalyzeModuleReviewHistory = (
  _ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    allFileModules: Array<{
      file: AutoBeAnalyzeFile.Scenario;
      moduleEvent: AutoBeAnalyzeWriteModuleEvent;
      status: "approved" | "rewritten" | "new";
    }>;
    preliminary: null | AutoBePreliminaryController<"previousAnalysisFiles">;
  },
): IAutoBeOrchestrateHistory => {
  return {
    histories: [
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.ANALYZE_MODULE_REVIEW,
      },
      ...(props.preliminary?.getHistories() ?? []),
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: StringUtil.trim`
        ## Language

        The language of the document is ${JSON.stringify(props.scenario.language ?? "en-US")}.

        ## All Files' Module Structures to Review

        Please review ALL files' module structures below for cross-file consistency:

        ${props.allFileModules
          .map(
            ({ file, moduleEvent, status }, fileIndex) => `
        ---
        ## File ${fileIndex + 1}: ${file.filename} [Status: ${status === "approved" ? "✅ Previously Approved" : status === "rewritten" ? "🔄 Rewritten" : "🆕 New"}]

        **Title**: ${moduleEvent.title}
        **Summary**: ${moduleEvent.summary}

        ### Module Sections

        ${moduleEvent.moduleSections
          .map(
            (section, index) => `
        #### Module ${index + 1}: ${section.title}
        **Purpose**: ${section.purpose}
        **Content**: ${section.content ?? "No content"}
        `,
          )
          .join("\n")}
        `,
          )
          .join("\n")}

        ## Cross-File Review Criteria

        Please evaluate across ALL files:
        1. Is terminology consistent across all files?
        2. Are structural patterns uniform?
        3. Are abstraction levels comparable?
        4. Are scope boundaries clear and non-overlapping between files?
        5. Are naming conventions consistent?
        6. Are values consistent throughout?
      `,
      },
    ],
    userMessage:
      "Review ALL files' module structures for cross-file consistency and provide per-file approved/rejected verdicts.",
  };
};
