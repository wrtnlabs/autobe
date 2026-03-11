import {
  AutoBeAnalyzeFileScenario,
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
 * Transform histories for per-module review of section content.
 *
 * This transformer provides context for reviewing a SINGLE module's section
 * content, validating value consistency, prohibited content, bridge block
 * completeness, and intra-module deduplication. Sibling modules are included as
 * lightweight title-only context for intra-file consistency reference.
 */
export const transformAnalyzeSectionReviewHistory = (
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    file: AutoBeAnalyzeFileScenario;
    moduleEvent: AutoBeAnalyzeWriteModuleEvent;
    moduleIndex: number;
    unitEvent: AutoBeAnalyzeWriteUnitEvent;
    moduleSectionEvents: AutoBeAnalyzeWriteSectionEvent[];
    siblingModuleSummaries: Array<{
      moduleIndex: number;
      title: string;
      sectionTitles: string[];
    }>;
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

        ## Sibling Modules (titles only, for intra-file consistency reference)

        ${
          props.siblingModuleSummaries.length > 0
            ? props.siblingModuleSummaries
                .map(
                  (s) =>
                    `- Module ${s.moduleIndex + 1}: ${s.title} — sections: ${s.sectionTitles.join(", ")}`,
                )
                .join("\n")
            : "(this is the only module in this file)"
        }

        ## Section Content to Review (Module ${props.moduleIndex + 1})

        ### Module ${props.moduleIndex + 1}: ${props.moduleEvent.moduleSections[props.moduleIndex]?.title ?? "Unknown"}

        ${props.moduleSectionEvents
          .map((sectionEvent, unitIndex) => {
            const unitSection: AutoBeAnalyzeUnitSection | undefined =
              props.unitEvent?.unitSections[unitIndex];
            return `
        #### Unit ${props.moduleIndex + 1}.${unitIndex + 1}: ${unitSection?.title ?? "Unknown"}

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

        ## File Scope

        **File**: ${props.file.filename}
        **Scope**: ${buildFixedAnalyzeExpandedTemplate((props.scenario.features ?? []) as FixedAnalyzeTemplateFeature[]).find((t) => t.filename === props.file.filename)?.description ?? "Unknown"}

        ## Authorized Scenario Reference

        **Entities**: ${props.scenario.entities.map((e) => e.name).join(", ")}
        **Actors**: ${props.scenario.actors.map((a) => `${a.name}(${a.kind})`).join(", ")}
        **Features**: ${(props.scenario.features ?? []).map((f) => f.id).join(", ") || "None"}

        Reject if content references entities, actors, or features NOT in this list.

        ## Original User Requirements (for traceability check)

        Every requirement in the sections above MUST be traceable to the user input below.
        REJECT if sections contain features, workflows, or constraints not stated or directly implied.

        ${ctx
          .histories()
          .filter((h) => h.type === "userMessage")
          .flatMap((h) =>
            h.type === "userMessage"
              ? h.contents.filter((c) => c.type === "text").map((c) => c.text)
              : [],
          )
          .join("\n\n---\n\n")}

        ## Per-Module Review Criteria

        Please evaluate this module's section content:
        1. Is ALL text in English only?
        2. Does content stay within this file's designated scope?
        3. Are values consistent with parent module/unit definitions?
        4. Is there any prohibited content (schemas, API specs, implementation details)?
        5. Are requirements written in clear natural language?
        6. Is there no duplicate content within this module?
        7. (For canonical files 01/02/04) Are YAML spec blocks present?
        8. Does content ONLY reference entities, actors, and features from the Authorized Scenario Reference above?
        9. Is terminology consistent with sibling modules listed above?
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
      "Review this module's section content for quality and provide an approved/rejected verdict.",
  };
};
