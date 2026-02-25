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

export const transformAnalyzeWriteModuleReviewHistory = (
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    file: AutoBeAnalyzeFile.Scenario;
    moduleEvent: AutoBeAnalyzeWriteModuleEvent;
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
      text: AutoBeSystemPromptConstant.ANALYZE_WRITE_MODULE_REVIEW,
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

        ## Module Section Structure to Review

        Please review the following module section structure:

        ### Title
        ${props.moduleEvent.title}

        ### Summary
        ${props.moduleEvent.summary}

        ### Module Sections
        ${props.moduleEvent.moduleSections
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
  userMessage: "Review the module section structure and approve or reject.",
});
