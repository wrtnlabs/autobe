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

export const transformAnalyzeWriteSectionReviewHistory = (
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    file: AutoBeAnalyzeFile.Scenario;
    moduleEvent: AutoBeAnalyzeWriteModuleEvent;
    unitEvent: AutoBeAnalyzeWriteUnitEvent;
    sectionEvent: AutoBeAnalyzeWriteSectionEvent;
    preliminary: null | AutoBePreliminaryController<"previousAnalysisFiles">;
  },
): IAutoBeOrchestrateHistory => {
  const moduleSection:
    | AutoBeAnalyzeWriteModuleEvent.IModuleSection
    | undefined =
    props.moduleEvent.moduleSections[props.sectionEvent.moduleIndex];
  const unitSection: AutoBeAnalyzeWriteUnitEvent.IUnitSection | undefined =
    props.unitEvent.unitSections[props.sectionEvent.unitIndex];

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
        text: AutoBeSystemPromptConstant.ANALYZE_WRITE_SECTION_REVIEW,
      },
      ...(props.preliminary?.getHistories() ?? []),
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: StringUtil.trim`
        ## Language

        The language of the document is ${JSON.stringify(props.scenario.language ?? "en-US")}.

        ## Parent Section Context (Reference for Consistency)

        ### Module Section: ${moduleSection?.title ?? "Unknown"}
        ${moduleSection?.content ?? "No content available"}

        ### Unit Section: ${unitSection?.title ?? "Unknown"}
        ${unitSection?.content ?? "No content available"}

        **IMPORTANT**: Any numeric values, limits, or constraints defined in the parent sections above
        MUST be consistent with the section sections below. Check for contradictions in:
        - File size limits (e.g., 10MB, 25MB)
        - Quantity limits (e.g., max attachments)
        - Time limits (e.g., session timeout)
        - Character limits (e.g., title length)
        If there are any contradictions, REJECT with specific details.

        ## Keywords That Should Be Addressed

        ${unitSection?.keywords.map((kw, i) => `${i + 1}. ${kw}`).join("\n") ?? "No keywords"}

        ## Sections to Review

        **Module Index**: ${props.sectionEvent.moduleIndex}
        **Unit Index**: ${props.sectionEvent.unitIndex}

        ${props.sectionEvent.sectionSections
          .map(
            (section, index) => `
        ### Section ${index + 1}: ${section.title}

        ${section.content}
        `,
          )
          .join("\n---\n")}

        ## Review Criteria

        Please verify:
        1. All keywords are addressed
        2. EARS format is correct (SHALL, not should)
        3. Requirements are specific and measurable
        4. No prohibited content (schemas, APIs, implementation)
        5. Mermaid syntax is correct (if present)
      `,
      },
    ],
    userMessage: "Review the sections and approve or reject.",
  };
};
