import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { transformInterfaceAssetHistories } from "./transformInterfaceAssetHistories";

export const transformInterfaceSchemaReviewHistories = (
  state: AutoBeState,
  schemaDescriptive: Record<
    string,
    AutoBeOpenApi.IJsonSchemaDescriptive<AutoBeOpenApi.IJsonSchema>
  >,
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  const keys = Object.keys(schemaDescriptive);
  return [
    {
      type: "systemMessage",
      id: v4(),
      created_at: new Date().toISOString(),
      text: AutoBeSystemPromptConstant.INTERFACE_SCHEMA,
    },
    ...transformInterfaceAssetHistories(state),
    {
      type: "systemMessage",
      id: v4(),
      created_at: new Date().toISOString(),
      text: AutoBeSystemPromptConstant.INTERFACE_SCHEMA_REVIEW.replace(
        "{targets}",
        JSON.stringify(keys),
      ),
    },
    {
      type: "assistantMessage",
      id: v4(),
      created_at: new Date().toISOString(),
      text: [
        "Here is the list of type interfaces you have to review:",
        "",
        "```json",
        JSON.stringify(schemaDescriptive),
        "```",
      ].join("\n"),
    },
  ];
};
