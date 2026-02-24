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
 * Transform histories for per-file review of section content.
 *
 * This transformer provides context for reviewing a SINGLE file's section
 * content, validating EARS format, value consistency, prohibited content,
 * bridge block completeness, and intra-file deduplication.
 */
export const transformAnalyzeSectionReviewHistory = (
  _ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    file: AutoBeAnalyzeFile.Scenario;
    moduleEvent: AutoBeAnalyzeWriteModuleEvent;
    unitEvents: AutoBeAnalyzeWriteUnitEvent[];
    sectionEvents: AutoBeAnalyzeWriteSectionEvent[][];
    feedback?: string;
    preliminary: null | AutoBePreliminaryController<"previousAnalysisFiles">;
  },
): IAutoBeOrchestrateHistory => {
  return {
    histories: [
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

        ## File: ${props.file.filename}

        **Title**: ${props.moduleEvent.title}
        **Summary**: ${props.moduleEvent.summary}

        ## Section Content to Review

        ${props.sectionEvents
          .map((sectionsForModule, moduleIndex) => {
            const moduleSection:
              | AutoBeAnalyzeWriteModuleEvent.IModuleSection
              | undefined = props.moduleEvent.moduleSections[moduleIndex];
            const unitEvent: AutoBeAnalyzeWriteUnitEvent | undefined =
              props.unitEvents[moduleIndex];
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

        ## Per-File Review Criteria

        Please evaluate this file's section content:
        1. Is EARS format correct and consistent within this file?
        2. Are values consistent with parent module/unit definitions?
        3. Is there any prohibited content?
        4. Does every section have a complete [DOWNSTREAM CONTEXT] Bridge Block?
        5. Are Bridge Block attributes properly specified with type + constraints?
        6. Is there no duplicate content within this file?
        ${
          props.feedback
            ? `
        ## Previous Attempt Feedback

        Your previous attempt was rejected. Please address these issues:

        ${props.feedback}
        `
            : ""
        }
      `,
      },
    ],
    userMessage:
      "Review this file's section content for quality and provide an approved/rejected verdict.",
  };
};
