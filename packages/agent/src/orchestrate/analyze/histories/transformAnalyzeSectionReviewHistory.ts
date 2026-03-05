import {
  AutoBeAnalyzeFileScenario,
  AutoBeAnalyzeModuleSection,
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeUnitSection,
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
import {
  FixedAnalyzeTemplateFeature,
  buildFixedAnalyzeExpandedTemplate,
} from "../structures/FixedAnalyzeTemplate";

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
    file: AutoBeAnalyzeFileScenario;
    moduleEvent: AutoBeAnalyzeWriteModuleEvent;
    unitEvents: AutoBeAnalyzeWriteUnitEvent[];
    sectionEvents: AutoBeAnalyzeWriteSectionEvent[][];
    feedback?: string;
    preliminary: null | AutoBePreliminaryController<"previousAnalysisSections">;
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
            const moduleSection: AutoBeAnalyzeModuleSection | undefined =
              props.moduleEvent.moduleSections[moduleIndex];
            const unitEvent: AutoBeAnalyzeWriteUnitEvent | undefined =
              props.unitEvents[moduleIndex];
            return `
        ### Module ${moduleIndex + 1}: ${moduleSection?.title ?? "Unknown"}

        ${sectionsForModule
          .map((sectionEvent, unitIndex) => {
            const unitSection: AutoBeAnalyzeUnitSection | undefined =
              unitEvent?.unitSections[unitIndex];
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

        ## File Scope

        **File**: ${props.file.filename}
        **Scope**: ${buildFixedAnalyzeExpandedTemplate((props.scenario.features ?? []) as FixedAnalyzeTemplateFeature[]).find((t) => t.filename === props.file.filename)?.description ?? "Unknown"}

        ## Authorized Scenario Reference

        **Entities**: ${props.scenario.entities.map((e) => e.name).join(", ")}
        **Actors**: ${props.scenario.actors.map((a) => `${a.name}(${a.kind})`).join(", ")}
        **Features**: ${(props.scenario.features ?? []).map((f) => f.id).join(", ") || "None"}

        Reject if content references entities, actors, or features NOT in this list.

        ## Per-File Review Criteria

        Please evaluate this file's section content:
        1. Is ALL text in English only?
        2. Does content stay within this file's designated scope?
        3. Are values consistent with parent module/unit definitions?
        4. Is there any prohibited content (schemas, API specs, implementation details)?
        5. Is EARS format correct and consistent?
        6. Is there no duplicate content within this file?
        7. (For canonical files 01/02/04) Are YAML spec blocks present?
        8. Does content ONLY reference entities, actors, and features from the Authorized Scenario Reference above?
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
