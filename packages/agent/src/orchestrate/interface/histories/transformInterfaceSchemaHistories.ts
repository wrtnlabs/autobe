import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBeInterfaceSchemaReviewApplication } from "../structures/IAutoBeInterfaceSchemaReviewApplication";
import { transformInterfaceAssetHistories } from "./transformInterfaceAssetHistories";

export const transformInterfaceSchemaHistories = (
  state: AutoBeState,
  operations: AutoBeOpenApi.IOperation[],
  reviews: IAutoBeInterfaceSchemaReviewApplication.IReview[],
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => [
  {
    type: "systemMessage",
    id: v4(),
    created_at: new Date().toISOString(),
    text: AutoBeSystemPromptConstant.INTERFACE_SCHEMA,
  },
  ...transformInterfaceAssetHistories(state),
  {
    type: "assistantMessage",
    id: v4(),
    created_at: new Date().toISOString(),
    text: [
      "Here is the list of API operations you have to implement its types:",
      "",
      "```json",
      JSON.stringify(operations),
      "```",
      reviews.length > 0
        ? [
            "This is the result of a review from a previous attempt. This attempt should reflect this review further.",
            "```json",
            JSON.stringify(reviews),
            "```",
          ]
        : [],
    ].join("\n"),
  },
];
