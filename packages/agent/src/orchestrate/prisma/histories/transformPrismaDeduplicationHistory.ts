import { AutoBeDatabaseComponent } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { NamingConvention } from "typia/lib/utils/NamingConvention";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

export const transformPrismaDeduplicationHistory = (props: {
  preliminary: AutoBePreliminaryController<
    "analysisFiles" | "previousAnalysisFiles" | "previousDatabaseSchemas"
  >;
  target: AutoBeDatabaseComponent;
  otherComponents: Pick<AutoBeDatabaseComponent, "namespace" | "tables">[];
  instruction: string;
  prefix: string | null;
}): IAutoBeOrchestrateHistory => {
  return {
    histories: [
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.DATABASE_DEDUPLICATION,
      },
      ...props.preliminary.getHistories(),
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: StringUtil.trim`
          ## Component to Review (Deduplication)

          ${props.prefix !== null ? `**Table Prefix**: \`${NamingConvention.snake(props.prefix)}\`` : ""}

          ### Target Component

          - **Namespace**: \`${props.target.namespace}\`
          - **Filename**: \`${props.target.filename}\`

          ### Target Component Tables

          \`\`\`json
          ${JSON.stringify(props.target.tables)}
          \`\`\`

          ### Other Components Tables

          The following shows tables from OTHER components (excluding the target).
          Compare the target component's tables against these to identify semantic duplicates.

          \`\`\`json
          ${JSON.stringify(props.otherComponents)}
          \`\`\`

          ### User Instructions

          ${props.instruction}
        `,
      },
    ],
    userMessage: StringUtil.trim`
      Review the "${props.target.namespace}" component's tables for semantic duplicates.

      **Your task**: Compare each table in the "${props.target.namespace}" component against
      tables in other components. Identify tables that serve the **same purpose**
      even if they have different names.

      ## How to identify duplicates

      1. First, fetch analysis files using \`getAnalysisFiles\` to understand the business context
      2. For each table in "${props.target.namespace}", **read its \`description\` field carefully**
      3. For each table in other components, **read its \`description\` field carefully**
      4. **Compare the descriptions**: If two tables describe the **same purpose** (storing the same kind of data for the same business reason), they are duplicates
      5. Call \`process({ request: { type: "complete", analysis: "...", rationale: "...", duplicateGroups: [...] } })\`

      ## Critical: Description is the primary judgment criterion

      - **DO NOT rely on table names alone** — names can be misleading
      - **READ the \`description\` field** — this tells you what the table actually stores
      - **Same purpose in description = DUPLICATE** (even with completely different names)
      - **Different purpose in description = NOT duplicate** (even with similar names)

      ## Rules

      - Each duplicate group must have at least 2 tables
      - Each group must include at least 1 table from "${props.target.namespace}"
      - Parent-child relationships are NOT duplicates
      - Snapshot/history tables are NOT duplicates of their source tables
      - If no duplicates found, return an empty duplicateGroups array
    `,
  };
};
