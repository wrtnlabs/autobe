import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { transformInterfaceAssetHistories } from "./transformInterfaceAssetHistories";

export const transformInterfaceSchemasReviewHistories = (
  state: AutoBeState,
  schemaDescriptive: Record<
    string,
    AutoBeOpenApi.IJsonSchemaDescriptive<AutoBeOpenApi.IJsonSchema>
  >,
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  return [
    {
      type: "systemMessage",
      id: v4(),
      created_at: new Date().toISOString(),
      text: AutoBeSystemPromptConstant.INTERFACE_SCHEMA,
    },
    ...transformInterfaceAssetHistories(state),
    {
      id: v4(),
      type: "assistantMessage",
      created_at: new Date().toISOString(),
      text: [
        "Below is the schema to be reviewed:",
        "```json",
        JSON.stringify(schemaDescriptive),
        "",
      ].join("\n"),
    },
    {
      type: "systemMessage",
      id: v4(),
      created_at: new Date().toISOString(),
      text: AutoBeSystemPromptConstant.INTERFACE_SCHEMA_REVIEW,
    },
  ];
};
