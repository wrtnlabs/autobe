import { AutoBeAnalyzeScenarioEvent } from "@autobe/interface";
import { AutoBeAnalyzeFile } from "@autobe/interface/src/histories/contents/AutoBeAnalyzeFile";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

export const transformAnalyzeWriteHistories = (
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    file: AutoBeAnalyzeFile.Scenario;
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
      text: AutoBeSystemPromptConstant.ANALYZE_WRITE,
    },
    ...(props.preliminary?.getHistories() ?? []),
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: StringUtil.trim`
        ## Language
        
        The language of the document is ${JSON.stringify(props.scenario.language ?? "en-US")}.
        
        ## Metadata
        
        Prefix name of the service to create is ${props.scenario.prefix}
        and here is the list of the actors to reference.

        \`\`\`json
        ${JSON.stringify(props.scenario.actors)}
        \`\`\`

        Here is the entire list of the documents that would be published
        in someday, and your task is to write a document of them:
        
        ## The other documents that would be published in someday

        \`\`\`json
        ${JSON.stringify(
          props.scenario.files.filter(
            (f) => f.filename !== props.file.filename,
          ),
        )}
        \`\`\`
        
        ## The document to write
        \`\`\`json
        ${JSON.stringify(props.file)}
        \`\`\`
      `,
    },
  ],
  userMessage: "Write requirement analysis report.",
});
