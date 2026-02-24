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

export const transformAnalyzeWriteSectionPatchHistory = (
  _ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    file: AutoBeAnalyzeFile.Scenario;
    moduleEvent: AutoBeAnalyzeWriteModuleEvent;
    unitEvent: AutoBeAnalyzeWriteUnitEvent;
    moduleIndex: number;
    unitIndex: number;
    previousSectionEvent: AutoBeAnalyzeWriteSectionEvent;
    feedback: string;
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
        text: AutoBeSystemPromptConstant.ANALYZE_WRITE_SECTION_PATCH,
      },
      ...(props.preliminary?.getHistories() ?? []),
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: StringUtil.trim`
        ## Parent Context

        **Module**: ${moduleSection?.title ?? "Unknown"}
        **Unit**: ${unitSection?.title ?? "Unknown"}
        **Purpose**: ${unitSection?.purpose ?? "Unknown"}

        ## Previous Output (REJECTED)

        The following sections were generated but REJECTED by review:

        ${props.previousSectionEvent.sectionSections
          .map(
            (s, i) => `
        ### Section ${i + 1}: ${s.title}

        ${s.content}
        `,
          )
          .join("\n---\n")}

        ## Review Feedback

        The review REJECTED the above output for these reasons:

        ${props.feedback}

        ## Your Task

        Fix ONLY the issues identified above. Return ALL sections
        (both fixed and unchanged) in the same sectionSections format.
        Do NOT rewrite sections that were not flagged in the feedback.
        `,
      },
    ],
    userMessage: `Fix the rejected sections for "${unitSection?.title ?? "Unknown"}" based on the review feedback above.`,
  };
};
