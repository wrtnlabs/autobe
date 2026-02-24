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

export const transformAnalyzeWriteSectionHistory = (
  _ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    file: AutoBeAnalyzeFile.Scenario;
    moduleEvent: AutoBeAnalyzeWriteModuleEvent;
    unitEvent: AutoBeAnalyzeWriteUnitEvent;
    moduleIndex: number;
    unitIndex: number;
    feedback?: string;
    preliminary: null | AutoBePreliminaryController<"previousAnalysisFiles">;
  },
): IAutoBeOrchestrateHistory => {
  const moduleSection:
    | AutoBeAnalyzeWriteModuleEvent.IModuleSection
    | undefined = props.moduleEvent.moduleSections[props.moduleIndex];
  const unitSection: AutoBeAnalyzeWriteUnitEvent.IUnitSection | undefined =
    props.unitEvent.unitSections[props.unitIndex];

  return {
    histories: [
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.ANALYZE_WRITE_SECTION,
      },
      ...(props.preliminary?.getHistories() ?? []),
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: StringUtil.trim`
        ## Language

        The language of the document is ${JSON.stringify(props.scenario.language ?? "en-US")}.

        ## Document Context

        **Document Title**: ${props.moduleEvent.title}
        **Document Summary**: ${props.moduleEvent.summary}

        ## Parent Module Section

        **Module Index**: ${props.moduleIndex}
        **Title**: ${moduleSection?.title ?? "Unknown"}
        **Purpose**: ${moduleSection?.purpose ?? "Unknown"}
        **Content**: ${moduleSection?.content ?? "No content"}

        ## Parent Unit Section

        **Unit Index**: ${props.unitIndex}
        **Title**: ${unitSection?.title ?? "Unknown"}
        **Purpose**: ${unitSection?.purpose ?? "Unknown"}
        **Content**: ${unitSection?.content ?? "Unknown"}

        ## CRITICAL: Value Consistency

        **You MUST use the EXACT same values defined in parent sections above.**
        If the parent section says "10MB file limit", you MUST use 10MB, not 25MB or 5MB.
        If the parent section says "5 attachments maximum", you MUST use 5, not 10.
        Any deviation will cause the review to REJECT your output.

        ## CRITICAL: No Duplicate Content

        Each section MUST contain unique information:
        - Do NOT restate requirements already implied by sibling sections' keywords
        - In your [DOWNSTREAM CONTEXT] Bridge Block, define each Entity.attribute ONLY in the first section that introduces it
        - Subsequent sections referencing the same attribute should use: "(defined in [Section Name])"
        - Do NOT duplicate state transitions, operations, or permission rules across sections

        ## Keywords to Address

        You MUST create sections that address these keywords:

        ${unitSection?.keywords.map((kw, i) => `${i + 1}. ${kw}`).join("\n") ?? "No keywords"}

        ## Your Task

        Create detailed sections (#### level) with EARS-formatted requirements
        that address ALL the keywords above.
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
    userMessage: `Create detailed sections with EARS requirements for "${unitSection?.title ?? "Unknown"}".`,
  };
};
