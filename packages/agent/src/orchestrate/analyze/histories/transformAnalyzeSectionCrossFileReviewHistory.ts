import {
  AutoBeAnalyzeFile,
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeWriteModuleEvent,
  AutoBeAnalyzeWriteSectionEvent,
  AutoBeAnalyzeWriteUnitEvent,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

/**
 * Transform histories for cross-file lightweight review of section metadata.
 *
 * This transformer provides ONLY section titles, keywords, and purposes from
 * ALL files — NOT full content. This keeps the input well within context
 * limits even with hundreds of sections.
 */
export const transformAnalyzeSectionCrossFileReviewHistory = (
  _ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    allFileSummaries: Array<{
      file: AutoBeAnalyzeFile.Scenario;
      moduleEvent: AutoBeAnalyzeWriteModuleEvent;
      unitEvents: AutoBeAnalyzeWriteUnitEvent[];
      sectionEvents: AutoBeAnalyzeWriteSectionEvent[][];
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
        text: AutoBeSystemPromptConstant.ANALYZE_SECTION_CROSS_FILE_REVIEW,
      },
      ...(props.preliminary?.getHistories() ?? []),
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: StringUtil.trim`
        ## Language

        The language of the document is ${JSON.stringify(props.scenario.language ?? "en-US")}.

        ## All Files' Section Metadata for Cross-File Consistency Review

        Below is lightweight metadata (titles, keywords, purposes) from ALL files.
        Full content has already been validated in per-file review.

        ${props.allFileSummaries
          .map(
            (
              { file, moduleEvent, unitEvents, sectionEvents, status },
              fileIndex,
            ) => `
        ---
        ## File ${fileIndex + 1}: ${file.filename} [Status: ${status === "approved" ? "✅ Previously Approved" : status === "rewritten" ? "🔄 Rewritten" : "🆕 New"}]

        **Title**: ${moduleEvent.title}
        **Summary**: ${moduleEvent.summary}

        ${sectionEvents
          .map((sectionsForModule, moduleIndex) => {
            const moduleSection =
              moduleEvent.moduleSections[moduleIndex];
            const unitEvent = unitEvents[moduleIndex];
            return `
        ### Module ${moduleIndex + 1}: ${moduleSection?.title ?? "Unknown"}

        ${sectionsForModule
          .map((sectionEvent, unitIndex) => {
            const unitSection = unitEvent?.unitSections[unitIndex];
            return `
        #### Unit ${moduleIndex + 1}.${unitIndex + 1}: ${unitSection?.title ?? "Unknown"}
        **Keywords**: ${unitSection?.keywords.join(", ") ?? "None"}

        Sections:
        ${sectionEvent.sectionSections
          .map(
            (section) =>
              `- **${section.title}**`,
          )
          .join("\n")}
        `;
          })
          .join("\n")}
        `;
          })
          .join("\n")}
        `,
          )
          .join("\n")}

        ## Cross-File Consistency Criteria

        Please evaluate across ALL files:
        1. Are values and constraints consistent across all files?
        2. Is terminology aligned (same concepts = same terms)?
        3. Are naming conventions consistent?
        4. Is there content duplication between files?
        5. Is structural depth proportionate across files?
      `,
      },
    ],
    userMessage:
      "Review ALL files' section metadata for cross-file consistency and provide per-file approved/rejected verdicts.",
  };
};
