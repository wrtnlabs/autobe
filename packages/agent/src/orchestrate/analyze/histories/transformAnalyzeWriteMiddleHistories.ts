import {
  AutoBeAnalyzeFile,
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeWriteMajorEvent,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

export const transformAnalyzeWriteMiddleHistories = (
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    file: AutoBeAnalyzeFile.Scenario;
    majorEvent: AutoBeAnalyzeWriteMajorEvent;
    majorIndex: number;
    feedback?: string;
    preliminary: null | AutoBePreliminaryController<"previousAnalysisFiles">;
  },
): IAutoBeOrchestrateHistory => {
  const majorSection = props.majorEvent.majorSections[props.majorIndex];

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
        text: AutoBeSystemPromptConstant.ANALYZE_WRITE_MIDDLE,
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

        ## Approved Major Section Structure

        Here are all the major sections for context:

        ${props.majorEvent.majorSections
          .map(
            (section, index) => `
        ### ${index + 1}. ${section.title}
        **Purpose**: ${section.purpose}
        `,
          )
          .join("\n")}

        ## Your Task: Create Middle Sections for Major Section ${props.majorIndex + 1}

        You need to create middle sections (### level) for this major section:

        **Major Section**: ${majorSection?.title ?? "Unknown"}
        **Major Index**: ${props.majorIndex}
        **Purpose**: ${majorSection?.purpose ?? "Unknown"}
        **Content**: ${majorSection?.content ?? "Unknown"}

        Create middle sections that break down this major section into functional groupings.
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
    userMessage: `Create middle sections (### level) for major section "${majorSection?.title ?? "Unknown"}".`,
  };
};
