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
  ctx: AutoBeContext,
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
