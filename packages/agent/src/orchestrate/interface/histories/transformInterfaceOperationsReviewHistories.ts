import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { IAutoBePreliminaryCollection } from "../../common/structures/IAutoBePreliminaryCollection";
import { transformInterfaceAssetHistories } from "./transformInterfaceAssetHistories";

export function transformInterfaceOperationsReviewHistories(props: {
  local: Pick<IAutoBePreliminaryCollection, "analyzeFiles" | "prismaSchemas">;
  operations: AutoBeOpenApi.IOperation[];
}): IAutoBeOrchestrateHistory {
  return {
    histories: [
      {
        type: "systemMessage",
        id: v7(),
        created_at: new Date().toISOString(),
        text: AutoBeSystemPromptConstant.INTERFACE_OPERATION,
      },
      ...transformInterfaceAssetHistories({
        local: props.local,
      }),
      {
        type: "systemMessage",
        id: v7(),
        created_at: new Date().toISOString(),
        text: AutoBeSystemPromptConstant.INTERFACE_OPERATION_REVIEW,
      },
      {
        type: "assistantMessage",
        id: v7(),
        created_at: new Date().toISOString(),
        text: StringUtil.trim`
          Review the following API operations:

          \`\`\`json
          ${JSON.stringify(props.operations)}
          \`\`\`
        `,
      },
    ],
    userMessage: "Review the following API operations please",
  };
}
