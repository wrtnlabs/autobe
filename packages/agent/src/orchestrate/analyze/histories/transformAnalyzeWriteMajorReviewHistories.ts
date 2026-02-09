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

export const transformAnalyzeWriteMajorReviewHistories = (
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    file: AutoBeAnalyzeFile.Scenario;
    majorEvent: AutoBeAnalyzeWriteMajorEvent;
    preliminary: null | AutoBePreliminaryController<"previousAnalysisFiles">;
  },
): IAutoBeOrchestrateHistory => ({
  histories: [
    ...ctx
      .histories()
      .filter((h) => h.type === "userMessage" || h.type === "assistantMessage")
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
      text: AutoBeSystemPromptConstant.ANALYZE_WRITE_MAJOR_REVIEW,
    },
    ...(props.preliminary?.getHistories() ?? []),
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: StringUtil.trim`
        ## Language

        The language of the document is ${JSON.stringify(props.scenario.language ?? "en-US")}.

        ## Document Metadata

        \`\`\`json
        ${JSON.stringify(props.file)}
        \`\`\`

        ## Major Section Structure to Review

        Please review the following major section structure:

        ### Title
        ${props.majorEvent.title}

        ### Summary
        ${props.majorEvent.summary}

        ### Major Sections
        ${props.majorEvent.majorSections
          .map(
            (section, index) => `
        #### Section ${index + 1}: ${section.title}
        **Purpose**: ${section.purpose}
        **Content**: ${section.content}
        `,
          )
          .join("\n")}

        ## Review Criteria

        Please evaluate:
        1. Is the title clear and descriptive?
        2. Does the summary explain purpose and scope?
        3. Are all business domains covered?
        4. Are section boundaries clear (no overlap)?
        5. Is the order logical?
        6. Is content at appropriate abstraction level?
      `,
    },
  ],
  userMessage: "Review the major section structure and approve or reject.",
});
