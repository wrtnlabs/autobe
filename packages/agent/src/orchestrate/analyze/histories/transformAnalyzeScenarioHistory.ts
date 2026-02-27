import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

export const transformAnalyzeScenarioHistory = (
  ctx: AutoBeContext,
  preliminary: AutoBePreliminaryController<"previousAnalysisFiles">,
): IAutoBeOrchestrateHistory => ({
  histories: [
    ...ctx
      .histories()
      .filter((h) => h.type === "userMessage" || h.type === "assistantMessage"),
    {
      id: v7(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.ANALYZE_SCENARIO,
      created_at: new Date().toISOString(),
    },
    ...preliminary.getHistories(),
  ],
  userMessage: StringUtil.trim`
    You are in the Analyze Scenario stage, which comes BEFORE Analyze Write.
    Your job is to design the document list and user actors, not to write any documents.

    Design a complete list of documents and user actors for this project.
    Define user actors that can authenticate via API and create appropriate documentation files.
    You must respect the number of documents specified by the user.
    Note that the user's locale is in ${ctx.locale}.
  `,
});
