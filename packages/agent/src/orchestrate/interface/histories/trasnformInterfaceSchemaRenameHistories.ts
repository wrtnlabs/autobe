import { IAgenticaHistoryJson } from "@agentica/core";

export const transformInterfaceSchemaRenameHistories = (props: {
  tableNames: string[];
  typeNames: string[];
}): Array<
  IAgenticaHistoryJson.ISystemMessage | IAgenticaHistoryJson.IAssistantMessage
> => {};
