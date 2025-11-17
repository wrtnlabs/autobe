import {
  AutoBeDescribeImageDraftGroup,
  AutoBeDescribeImageDraftMetadata,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";

export const transformDescribeImagesDraftsGroupsHistories = (props: {
  metadata: AutoBeDescribeImageDraftMetadata[];
  existingGroups?: AutoBeDescribeImageDraftGroup[];
}): IAutoBeOrchestrateHistory => {
  const hasExistingGroups =
    props.existingGroups && props.existingGroups.length > 0;

  // Get all cluster keys that have already been processed
  const processedClusterKeys = props.existingGroups?.map((g) => g.clusterKey);

  // Filter out metadata that have already been grouped
  const ungroupedMetadata = props.metadata.filter(
    (m) => !processedClusterKeys?.includes(m.clusterKey),
  );

  return {
    histories: [
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.DESCRIBE_IMAGES_GROUPS,
      },
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: StringUtil.trim`
        ## Image Draft Metadata

        ${
          hasExistingGroups
            ? `### Already Grouped (${props.existingGroups!.length} groups)
        ${JSON.stringify(
          props.existingGroups!.map((g) => ({
            clusterKey: g.clusterKey,
            summary: g.summary,
            draftCount: g.drafts.length,
          })),
          null,
          2,
        )}

        ### Remaining Ungrouped Drafts (${ungroupedMetadata.length} drafts)`
            : `Here are ${props.metadata.length} image drafts to group:`
        }
        
        ${JSON.stringify(hasExistingGroups ? ungroupedMetadata : props.metadata, null, 2)}

        ${
          hasExistingGroups
            ? "Please group the remaining drafts. Each originClusterKey must map to a newClusterKey."
            : "Please group these drafts by their cluster keys and consolidate related functionality."
        }
      `,
      },
    ],
    userMessage:
      "Group these drafts by their cluster keys and consolidate related functionality.",
  };
};
