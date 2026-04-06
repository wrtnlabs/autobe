import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

export const transformAnalyzeScenarioHistory = (
  ctx: AutoBeContext,
  preliminary: AutoBePreliminaryController<
    "previousAnalysisSections" | "complete"
  >,
  feedback?: string,
): IAutoBeOrchestrateHistory => ({
  histories: [
    {
      id: v7(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.ANALYZE_SCENARIO,
      created_at: new Date().toISOString(),
    },
    ...ctx
      .histories()
      .filter((h) => h.type === "userMessage" || h.type === "assistantMessage"),
    ...preliminary.getHistories(),
    ...(feedback
      ? [
          {
            id: v7(),
            type: "assistantMessage" as const,
            text: StringUtil.trim`
              ## Previous Attempt Feedback

              Your previous scenario was rejected during review. Please address the following issues:

              ${feedback}

              Revise your scenario to fix these problems while keeping everything else correct.
            `,
            created_at: new Date().toISOString(),
          },
        ]
      : []),
  ],
  userMessage: StringUtil.trim`
    You are in the Analyze Scenario stage, which comes BEFORE Analyze Write.
    Your job is to identify actors, entities, and project characteristics — NOT to write documents.

    The document structure is fixed as 6 SRS files (00-toc through 05-non-functional).
    You do NOT decide file names, file count, or document structure.

    Identify the project prefix, user actors, core domain entities, and language.
    Define user actors that can authenticate via API.
    Note that the user's locale is in ${ctx.locale}.
  `,
});
