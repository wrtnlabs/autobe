import { IMicroAgenticaHistoryJson } from "@agentica/core";
import { 
  AutoBeDescribeImageDraftIntegrationEvent
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";

export const transformDescribeImagesDocumentHistories = (props: {
  integrations: AutoBeDescribeImageDraftIntegrationEvent[];
}): IMicroAgenticaHistoryJson[] => [
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.DESCRIBE_IMAGES_DOCUMENT,
    },
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: StringUtil.trim`
        Here are all the integrated sections to combine into a complete document:

        Total Sections: ${props.integrations.length}
        
        ${props.integrations.map((integration, index) => StringUtil.trim`
          === Section ${index + 1}: ${integration.clusterKey} ===
          
          ${integration.integration}
        `).join("\n\n")}
      `,
    },
  ];