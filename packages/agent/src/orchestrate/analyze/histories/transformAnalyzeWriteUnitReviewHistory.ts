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

export const transformAnalyzeWriteUnitReviewHistory = (
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    file: AutoBeAnalyzeFile.Scenario;
    moduleEvent: AutoBeAnalyzeWriteModuleEvent;
    unitEvent: AutoBeAnalyzeWriteUnitEvent;
    preliminary: null | AutoBePreliminaryController<"previousAnalysisFiles">;
  },
): IAutoBeOrchestrateHistory => {
  const moduleSection:
    | AutoBeAnalyzeWriteModuleEvent.IModuleSection
    | undefined = props.moduleEvent.moduleSections[props.unitEvent.moduleIndex];

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
        text: AutoBeSystemPromptConstant.ANALYZE_WRITE_UNIT_REVIEW,
      },
      ...(props.preliminary?.getHistories() ?? []),
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: StringUtil.trim`
        ## Language

        The language of the document is ${JSON.stringify(props.scenario.language ?? "en-US")}.

        ## Parent Module Section Context

        **Module Index**: ${props.unitEvent.moduleIndex}
        **Module Section Title**: ${moduleSection?.title ?? "Unknown"}
        **Module Section Purpose**: ${moduleSection?.purpose ?? "Unknown"}

        ### Module Section Content (Reference for Consistency)
        ${moduleSection?.content ?? "No content available"}

        **IMPORTANT**: Any numeric values, limits, or constraints defined in the module section above
        MUST be consistent with the unit sections below. If there are contradictions, REJECT.

        ## Unit Sections to Review

        Please review the following unit sections:

        ${props.unitEvent.unitSections
          .map(
            (section, index) => `
        ### Unit Section ${index + 1}: ${section.title}
        **Purpose**: ${section.purpose}
        **Content**: ${section.content}
        **Keywords**: ${section.keywords.join(", ")}
        `,
          )
          .join("\n")}

        ## Review Criteria

        Please evaluate:
        1. Do unit sections align with the module section's purpose?
        2. Are all functional areas adequately covered?
        3. Are section boundaries clear (no overlap)?
        4. Are keywords specific and actionable for section generation?
        5. Is content at appropriate abstraction level?
      `,
      },
    ],
    userMessage: "Review the unit sections and approve or reject.",
  };
};
