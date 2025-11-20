import { AutoBeImageDescribeDraftIntegrationEvent } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";

export const transformImageDescribeDocumentHistories = (props: {
  integrations: AutoBeImageDescribeDraftIntegrationEvent[];
}): IAutoBeOrchestrateHistory => {
  return {
    histories: [
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.IMAGE_DESCRIBE_DOCUMENT,
      },
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: StringUtil.trim`
        Here are all the integrated sections to combine into a complete document:

        Total Sections: ${props.integrations.length}
        
        ${props.integrations
          .map(
            (integration, index) => StringUtil.trim`
          === Section ${index + 1}: ${integration.clusterKey} ===
          
          ${integration.integration}
        `,
          )
          .join("\n\n")}
      `,
      },
    ],
    userMessage: `Combine all ${props.integrations.length} integrated sections into a complete B2B SaaS requirements document.`,
  };
};
