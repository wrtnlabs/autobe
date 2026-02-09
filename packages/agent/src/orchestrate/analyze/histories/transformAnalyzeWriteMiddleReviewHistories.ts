import {
  AutoBeAnalyzeFile,
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeWriteMajorEvent,
  AutoBeAnalyzeWriteMiddleEvent,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

export const transformAnalyzeWriteMiddleReviewHistories = (
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    file: AutoBeAnalyzeFile.Scenario;
    majorEvent: AutoBeAnalyzeWriteMajorEvent;
    middleEvent: AutoBeAnalyzeWriteMiddleEvent;
    preliminary: null | AutoBePreliminaryController<"previousAnalysisFiles">;
  },
): IAutoBeOrchestrateHistory => {
  const majorSection =
    props.majorEvent.majorSections[props.middleEvent.majorIndex];

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
        text: AutoBeSystemPromptConstant.ANALYZE_WRITE_MIDDLE_REVIEW,
      },
      ...(props.preliminary?.getHistories() ?? []),
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: StringUtil.trim`
        ## Language

        The language of the document is ${JSON.stringify(props.scenario.language ?? "en-US")}.

        ## Parent Major Section Context

        **Major Index**: ${props.middleEvent.majorIndex}
        **Major Section Title**: ${majorSection?.title ?? "Unknown"}
        **Major Section Purpose**: ${majorSection?.purpose ?? "Unknown"}

        ## Middle Sections to Review

        Please review the following middle sections:

        ${props.middleEvent.middleSections
          .map(
            (section, index) => `
        ### Middle Section ${index + 1}: ${section.title}
        **Purpose**: ${section.purpose}
        **Content**: ${section.content}
        **Keywords**: ${section.keywords.join(", ")}
        `,
          )
          .join("\n")}

        ## Review Criteria

        Please evaluate:
        1. Do middle sections align with the major section's purpose?
        2. Are all functional areas adequately covered?
        3. Are section boundaries clear (no overlap)?
        4. Are keywords specific and actionable for minor section generation?
        5. Is content at appropriate abstraction level?
      `,
      },
    ],
    userMessage: "Review the middle sections and approve or reject.",
  };
};
