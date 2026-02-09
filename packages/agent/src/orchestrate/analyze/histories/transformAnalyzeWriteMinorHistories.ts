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

export const transformAnalyzeWriteMinorHistories = (
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    file: AutoBeAnalyzeFile.Scenario;
    majorEvent: AutoBeAnalyzeWriteMajorEvent;
    middleEvent: AutoBeAnalyzeWriteMiddleEvent;
    majorIndex: number;
    middleIndex: number;
    feedback?: string;
    preliminary: null | AutoBePreliminaryController<"previousAnalysisFiles">;
  },
): IAutoBeOrchestrateHistory => {
  const majorSection = props.majorEvent.majorSections[props.majorIndex];
  const middleSection = props.middleEvent.middleSections[props.middleIndex];

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
        text: AutoBeSystemPromptConstant.ANALYZE_WRITE_MINOR,
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

        **Document Title**: ${props.majorEvent.title}
        **Document Summary**: ${props.majorEvent.summary}

        ## Parent Major Section

        **Major Index**: ${props.majorIndex}
        **Title**: ${majorSection?.title ?? "Unknown"}
        **Purpose**: ${majorSection?.purpose ?? "Unknown"}

        ## Parent Middle Section

        **Middle Index**: ${props.middleIndex}
        **Title**: ${middleSection?.title ?? "Unknown"}
        **Purpose**: ${middleSection?.purpose ?? "Unknown"}
        **Content**: ${middleSection?.content ?? "Unknown"}

        ## Keywords to Address

        You MUST create minor sections that address these keywords:

        ${middleSection?.keywords.map((kw, i) => `${i + 1}. ${kw}`).join("\n") ?? "No keywords"}

        ## Your Task

        Create detailed minor sections (#### level) with EARS-formatted requirements
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
    userMessage: `Create detailed minor sections with EARS requirements for "${middleSection?.title ?? "Unknown"}".`,
  };
};
