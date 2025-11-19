import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

export function transformInterfaceOperationReviewHistory(props: {
  preliminary: AutoBePreliminaryController<"analysisFiles" | "prismaSchemas">;
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
      ...props.preliminary.getHistories(),
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
