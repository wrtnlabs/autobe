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

        ## Original User Requirements (READ-ONLY Reference)

        Below is the original user input. Your unit sections MUST cover features described below
        that fall within this module's scope. Do NOT invent features not stated or directly implied.

        ${ctx
          .histories()
          .filter((h) => h.type === "userMessage")
          .flatMap((h) =>
            h.type === "userMessage"
              ? h.contents.filter((c) => c.type === "text").map((c) => c.text)
              : [],
          )
          .join("\n\n---\n\n")}

        ## Document Context

        **Document Title**: ${props.moduleEvent.title}
        **Document Summary**: ${props.moduleEvent.summary}

        ## Domain Entities Reference

        ${props.scenario.entities.map((e) => `- **${e.name}**: ${e.attributes.slice(0, 3).join(", ")}`).join("\n")}

        Units MUST reference ONLY entities listed above.

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

        ## CRITICAL: No Duplication with Other Module Sections

        The module sections listed above define clear boundaries. Your unit sections
        for "${moduleSection?.title ?? "Unknown"}" MUST NOT overlap with content belonging
        to other module sections. If a topic is covered by another module (e.g., Security
        covers authentication), do NOT create units for that topic here.
        Each entity-operation pair must belong to exactly ONE unit — no duplicates.

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
