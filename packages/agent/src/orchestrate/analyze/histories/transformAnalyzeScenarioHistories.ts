import { StringUtil } from "@autobe/utils";
import { ILlmSchema } from "@samchon/openapi";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

export const transformAnalyzeSceHistories = <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
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
    {
      id: v7(),
      type: "systemMessage",
      text: StringUtil.trim`
        > One agent per page of the document you specify will 
        > write according to the instructions below. You should also refer 
        > to the content to define the document list.

        ----------------------

        ${AutoBeSystemPromptConstant.ANALYZE_WRITE}
      `,
      created_at: new Date().toISOString(),
    },
    ...preliminary.getHistories(),
  ],
  userMessage: StringUtil.trim`
    Design a complete list of documents and user actors for this project.
    Define user actors that can authenticate via API and create appropriate documentation files.
    You must respect the number of documents specified by the user.
    Note that the user's locale is in ${ctx.locale}.
  `,
});
