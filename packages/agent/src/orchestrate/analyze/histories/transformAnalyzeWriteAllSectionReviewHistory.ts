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
 * Transform histories for batch review of ALL section sections in a file.
 *
 * This transformer provides context for reviewing all sections at once,
 * enabling holistic validation of the entire file's detailed content.
 */
export const transformAnalyzeWriteAllSectionReviewHistory = (
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    file: AutoBeAnalyzeFile.Scenario;
    moduleEvent: AutoBeAnalyzeWriteModuleEvent;
    unitEvents: AutoBeAnalyzeWriteUnitEvent[];
    sectionEvents: AutoBeAnalyzeWriteSectionEvent[][];
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
        text: AutoBeSystemPromptConstant.ANALYZE_WRITE_ALL_SECTION_REVIEW,
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

        ## Complete Document Content to Review

        Please review ALL section sections below for the entire file:

        ${props.sectionEvents
          .map((sectionsForModule, moduleIndex) => {
            const moduleSection:
              | AutoBeAnalyzeWriteModuleEvent.IModuleSection
              | undefined = props.moduleEvent.moduleSections[moduleIndex];
            const unitEvent: AutoBeAnalyzeWriteUnitEvent | undefined =
              props.unitEvents[moduleIndex];

            return `
        ---
        # Module ${moduleIndex + 1}: ${moduleSection?.title ?? "Unknown"}
        ${moduleSection?.content ?? "No content"}

        ${sectionsForModule
          .map((sectionEvent, unitIndex) => {
            const unitSection:
              | AutoBeAnalyzeWriteUnitEvent.IUnitSection
              | undefined = unitEvent?.unitSections[unitIndex];
            return `
        ## Unit ${moduleIndex + 1}.${unitIndex + 1}: ${unitSection?.title ?? "Unknown"}
        **Keywords**: ${unitSection?.keywords.join(", ") ?? "No keywords"}

        ${sectionEvent.sectionSections
          .map(
            (section, sectionIndex) => `
        ### Section ${moduleIndex + 1}.${unitIndex + 1}.${sectionIndex + 1}: ${section.title}

        ${section.content}
        `,
          )
          .join("\n---\n")}
        `;
          })
          .join("\n")}
        `;
          })
          .join("\n=====\n")}

        ## Review Criteria

        Please evaluate the ENTIRE file's section content:
        1. Are ALL keywords addressed for each unit?
        2. Is EARS format correct throughout (SHALL not should)?
        3. Are requirements specific and measurable everywhere?
        4. Is there NO prohibited content anywhere?
        5. Are Mermaid diagrams syntactically correct (if present)?
        6. Is content implementation-ready throughout?
        7. Are values consistent across all sections?
      `,
      },
    ],
    userMessage:
      "Review ALL section sections for the entire file and approve or reject as a whole.",
  };
};
