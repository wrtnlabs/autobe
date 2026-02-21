import {
  AutoBeAnalyzeFile,
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeWriteModuleEvent,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

export const transformAnalyzeWriteUnitHistory = (
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    file: AutoBeAnalyzeFile.Scenario;
    moduleEvent: AutoBeAnalyzeWriteModuleEvent;
    moduleIndex: number;
    feedback?: string;
    preliminary: null | AutoBePreliminaryController<"previousAnalysisFiles">;
  },
): IAutoBeOrchestrateHistory => {
  const moduleSection:
    | AutoBeAnalyzeWriteModuleEvent.IModuleSection
    | undefined = props.moduleEvent.moduleSections[props.moduleIndex];

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
        text: AutoBeSystemPromptConstant.ANALYZE_WRITE_UNIT,
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

        ## Approved Module Section Structure

        Here are all the module sections for context:

        ${props.moduleEvent.moduleSections
          .map(
            (section, index) => `
        ### ${index + 1}. ${section.title}
        **Purpose**: ${section.purpose}
        `,
          )
          .join("\n")}

        ## Your Task: Create Unit Sections for Module Section ${props.moduleIndex + 1}

        You need to create unit sections (### level) for this module section:

        **Module Section**: ${moduleSection?.title ?? "Unknown"}
        **Module Index**: ${props.moduleIndex}
        **Purpose**: ${moduleSection?.purpose ?? "Unknown"}
        **Content**: ${moduleSection?.content ?? "Unknown"}

        ## CRITICAL: Value Consistency

        **You MUST use the EXACT same values defined in the module section content above.**
        If the module section says "10MB file limit", you MUST use 10MB, not 25MB or 5MB.
        If the module section says "5 attachments maximum", you MUST use 5, not 10.
        Any deviation will cause the review to REJECT your output.

        Create unit sections that break down this module section into functional groupings.
        ${
          props.feedback
            ? `
        ## Previous Attempt Feedback

        Your previous attempt was rejected with the following feedback. Please address these issues:

        ${props.feedback}
        `
            : ""
        }
      `,
      },
    ],
    userMessage: `Create unit sections (### level) for module section "${moduleSection?.title ?? "Unknown"}".`,
  };
};
