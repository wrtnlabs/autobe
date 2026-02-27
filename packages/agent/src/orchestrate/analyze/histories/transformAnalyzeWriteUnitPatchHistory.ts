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

export const transformAnalyzeWriteUnitPatchHistory = (
  _ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    file: AutoBeAnalyzeFile.Scenario;
    moduleEvent: AutoBeAnalyzeWriteModuleEvent;
    moduleIndex: number;
    previousUnitEvent: AutoBeAnalyzeWriteUnitEvent;
    feedback: string;
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
        text: AutoBeSystemPromptConstant.ANALYZE_WRITE_UNIT_PATCH,
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

        ## Target Module Section

        **Module Section**: ${moduleSection?.title ?? "Unknown"}
        **Module Index**: ${props.moduleIndex}
        **Purpose**: ${moduleSection?.purpose ?? "Unknown"}
        **Content**: ${moduleSection?.content ?? "Unknown"}

        ## Previous Output (REJECTED)

        The following unit sections were generated but REJECTED by review:

        ${props.previousUnitEvent.unitSections
          .map(
            (s, i) => `
        ### Unit ${i + 1}: ${s.title}
        **Purpose**: ${s.purpose}
        **Content**: ${s.content}
        **Keywords**: ${s.keywords.join(", ")}
        `,
          )
          .join("\n---\n")}

        ## Review Feedback

        The review REJECTED the above output for these reasons:

        ${props.feedback}

        ## Your Task

        Fix ONLY the issues identified above. Return ALL unit sections
        (both fixed and unchanged) in the same unitSections format.
        Do NOT rewrite units that were not flagged in the feedback.
        `,
      },
    ],
    userMessage: `Fix the rejected unit sections for module "${moduleSection?.title ?? "Unknown"}" based on the review feedback above.`,
  };
};
