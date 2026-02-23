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
 * Transform histories for cross-file review of section content across ALL
 * files.
 *
 * This transformer provides context for reviewing all files' section content
 * together, enabling cross-file validation for EARS format, value consistency,
 * terminology, and Mermaid diagram style.
 */
export const transformAnalyzeSectionReviewHistory = (
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    allFileSections: Array<{
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
        text: AutoBeSystemPromptConstant.ANALYZE_SECTION_REVIEW,
      },
      ...(props.preliminary?.getHistories() ?? []),
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: StringUtil.trim`
        ## Language

        The language of the document is ${JSON.stringify(props.scenario.language ?? "en-US")}.

        ## All Files' Section Content to Review

        Please review ALL files' section content below for cross-file consistency:

        ${props.allFileSections
          .map(
            (
              { file, moduleEvent, unitEvents, sectionEvents, status },
              fileIndex,
            ) => `
        ---
        ## File ${fileIndex + 1}: ${file.filename} [Status: ${status === "approved" ? "✅ Previously Approved" : status === "rewritten" ? "🔄 Rewritten" : "🆕 New"}]

        **Title**: ${moduleEvent.title}

        ${sectionEvents
          .map((sectionsForModule, moduleIndex) => {
            const moduleSection:
              | AutoBeAnalyzeWriteModuleEvent.IModuleSection
              | undefined = moduleEvent.moduleSections[moduleIndex];
            const unitEvent: AutoBeAnalyzeWriteUnitEvent | undefined =
              unitEvents[moduleIndex];
            return `
        ### Module ${moduleIndex + 1}: ${moduleSection?.title ?? "Unknown"}

        ${sectionsForModule
          .map((sectionEvent, unitIndex) => {
            const unitSection:
              | AutoBeAnalyzeWriteUnitEvent.IUnitSection
              | undefined = unitEvent?.unitSections[unitIndex];
            return `
        #### Unit ${moduleIndex + 1}.${unitIndex + 1}: ${unitSection?.title ?? "Unknown"}

        ${sectionEvent.sectionSections
          .map(
            (section) => `
        ##### ${section.title}
        ${section.content}
        `,
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

        ## Cross-File Review Criteria

        Please evaluate across ALL files:
        1. Is EARS format consistent across all files?
        2. Are values and constraints consistent?
        3. Is terminology aligned across all files?
        4. Are Mermaid diagram styles uniform?
        5. Is there any prohibited content?
      `,
      },
    ],
    userMessage:
      "Review ALL files' section content for cross-file consistency and provide per-file approved/rejected verdicts.",
  };
};
