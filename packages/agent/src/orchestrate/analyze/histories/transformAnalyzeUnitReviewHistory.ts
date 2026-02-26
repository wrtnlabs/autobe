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
 * Transform histories for cross-file review of unit sections across ALL files.
 *
 * This transformer provides context for reviewing all files' unit structures
 * together, enabling cross-file validation for functional decomposition
 * consistency, keyword style, and depth balance.
 */
export const transformAnalyzeUnitReviewHistory = (
  _ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    allFileUnits: Array<{
      file: AutoBeAnalyzeFile.Scenario;
      moduleEvent: AutoBeAnalyzeWriteModuleEvent;
      unitEvents: AutoBeAnalyzeWriteUnitEvent[];
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
        text: AutoBeSystemPromptConstant.ANALYZE_UNIT_REVIEW,
      },
      ...(props.preliminary?.getHistories() ?? []),
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: StringUtil.trim`
        ## Language

        The language of the document is ${JSON.stringify(props.scenario.language ?? "en-US")}.

        ## All Files' Unit Structures to Review

        Please review ALL files' unit structures below for cross-file consistency:

        ${props.allFileUnits
          .map(
            ({ file, moduleEvent, unitEvents, status }, fileIndex) => `
        ---
        ## File ${fileIndex + 1}: ${file.filename} [Status: ${status === "approved" ? "✅ Previously Approved" : status === "rewritten" ? "🔄 Rewritten" : "🆕 New"}]

        **Title**: ${moduleEvent.title}
        **Summary**: ${moduleEvent.summary}

        ${unitEvents
          .map((unitEvent, moduleIndex) => {
            const moduleSection:
              | AutoBeAnalyzeWriteModuleEvent.IModuleSection
              | undefined = moduleEvent.moduleSections[moduleIndex];
            return `
        ### Module ${moduleIndex + 1}: ${moduleSection?.title ?? "Unknown"}

        ${unitEvent.unitSections
          .map(
            (section, unitIndex) => `
        #### Unit ${moduleIndex + 1}.${unitIndex + 1}: ${section.title}
        **Purpose**: ${section.purpose}
        **Content**: ${section.content}
        **Keywords**: ${(section.keywords ?? []).join(", ")}
        `,
          )
          .join("\n")}
        `;
          })
          .join("\n")}
        `,
          )
          .join("\n")}

        ## Cross-File Review Criteria

        Please evaluate across ALL files:
        1. Is functional decomposition granularity consistent?
        2. Are keyword styles and specificity uniform?
        3. Are unit section depths balanced across files?
        4. Are section boundaries drawn using consistent principles?
        5. Are values consistent throughout?
      `,
      },
    ],
    userMessage:
      "Review ALL files' unit structures for cross-file consistency and provide per-file approved/rejected verdicts.",
  };
};
