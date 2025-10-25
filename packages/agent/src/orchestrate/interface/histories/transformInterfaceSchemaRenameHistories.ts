import { IAgenticaHistoryJson } from "@agentica/core";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";

export const transformInterfaceSchemaRenameHistories = (props: {
  tableNames: string[];
  typeNames: string[];
}): Array<
  IAgenticaHistoryJson.ISystemMessage | IAgenticaHistoryJson.IAssistantMessage
> => {
  return [
    {
      type: "systemMessage",
      id: v7(),
      created_at: new Date().toISOString(),
      text: AutoBeSystemPromptConstant.INTERFACE_SCHEMA_RENAME,
    },
    {
      type: "assistantMessage",
      id: v7(),
      created_at: new Date().toISOString(),
      text: StringUtil.trim`
        ## Prisma Table Names

        Here is the complete list of table names from the Prisma database schema.
        Use these as the source of truth for determining correct DTO type names.

        Each table name should be converted to a DTO type name by:
        1. Converting from snake_case to PascalCase
        2. Preserving ALL words from the table name
        3. Adding "I" prefix for interface types

        **Table Names:**
        ${props.tableNames.map((name) => `- \`${name}\``).join("\n")}

        ## Current DTO Type Names

        Here is the list of existing DTO type names currently in the OpenAPI specification.
        Analyze these to identify which ones violate the naming rules by omitting
        intermediate words or service prefixes from their corresponding table names.

        **Current Type Names:**
        ${props.typeNames.map((name) => `- \`${name}\``).join("\n")}

        ## Your Task

        Compare the table names with the current type names to identify violations.
        For each type name that incorrectly omits words from its table name,
        provide a refactoring entry with the correct name that preserves all components.
      `,
    },
  ];
};
