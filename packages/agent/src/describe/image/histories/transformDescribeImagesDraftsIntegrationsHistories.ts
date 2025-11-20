import { AutoBeDescribeImageDraftGroup } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";

export const transformDescribeImagesDraftsIntegrationsHistories = (props: {
  group: AutoBeDescribeImageDraftGroup;
}): IAutoBeOrchestrateHistory => {
  return {
    histories: [
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.DESCRIBE_IMAGES_DRAFTS_INTEGRATIONS,
      },
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: StringUtil.trim`
        Here is the group information and all drafts to integrate:

        Cluster Key: ${props.group.clusterKey}
        Summary: ${props.group.summary}
        Topics: ${props.group.topics.join(", ")}
        Number of Drafts: ${props.group.drafts.length}

        Drafts to integrate:
        ${props.group.drafts
          .map(
            (draft, index) => StringUtil.trim`
          === Draft ${index + 1} ===
          ${draft}
        `,
          )
          .join("\n\n")}
      `,
      },
    ],
    userMessage: `Integrate all ${props.group.drafts.length} drafts for the "${props.group.clusterKey}" functional area into a single comprehensive section.`,
  };
};
