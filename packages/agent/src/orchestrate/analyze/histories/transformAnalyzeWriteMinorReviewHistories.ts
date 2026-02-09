import {
  AutoBeAnalyzeFile,
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeWriteMajorEvent,
  AutoBeAnalyzeWriteMiddleEvent,
  AutoBeAnalyzeWriteMinorEvent,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

export const transformAnalyzeWriteMinorReviewHistories = (
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    file: AutoBeAnalyzeFile.Scenario;
    majorEvent: AutoBeAnalyzeWriteMajorEvent;
    middleEvent: AutoBeAnalyzeWriteMiddleEvent;
    minorEvent: AutoBeAnalyzeWriteMinorEvent;
    preliminary: null | AutoBePreliminaryController<"previousAnalysisFiles">;
  },
): IAutoBeOrchestrateHistory => {
  const majorSection =
    props.majorEvent.majorSections[props.minorEvent.majorIndex];
  const middleSection =
    props.middleEvent.middleSections[props.minorEvent.middleIndex];

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
        text: AutoBeSystemPromptConstant.ANALYZE_WRITE_MINOR_REVIEW,
      },
      ...(props.preliminary?.getHistories() ?? []),
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: StringUtil.trim`
        ## Language

        The language of the document is ${JSON.stringify(props.scenario.language ?? "en-US")}.

        ## Context

        **Major Section**: ${majorSection?.title ?? "Unknown"}
        **Middle Section**: ${middleSection?.title ?? "Unknown"}

        ## Keywords That Should Be Addressed

        ${middleSection?.keywords.map((kw, i) => `${i + 1}. ${kw}`).join("\n") ?? "No keywords"}

        ## Minor Sections to Review

        **Major Index**: ${props.minorEvent.majorIndex}
        **Middle Index**: ${props.minorEvent.middleIndex}

        ${props.minorEvent.minorSections
          .map(
            (section, index) => `
        ### Minor Section ${index + 1}: ${section.title}

        ${section.content}
        `,
          )
          .join("\n---\n")}

        ## Review Criteria

        Please verify:
        1. All keywords are addressed
        2. EARS format is correct (SHALL, not should)
        3. Requirements are specific and measurable
        4. No prohibited content (schemas, APIs, implementation)
        5. Mermaid syntax is correct (if present)
      `,
      },
    ],
    userMessage: "Review the minor sections and approve or reject.",
  };
};
