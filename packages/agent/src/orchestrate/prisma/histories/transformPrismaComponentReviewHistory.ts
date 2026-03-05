import {
  AutoBeDatabaseComponent,
  AutoBeDatabaseComponentTableDesign,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

export const transformPrismaComponentReviewHistory = (props: {
  preliminary: AutoBePreliminaryController<
    "analysisSections" | "previousAnalysisSections" | "previousDatabaseSchemas"
  >;
  component: AutoBeDatabaseComponent;
  otherTables: AutoBeDatabaseComponentTableDesign[];
  instruction: string;
  prefix: string | null;
}): IAutoBeOrchestrateHistory => ({
  histories: [
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.DATABASE_COMPONENT,
    },
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.DATABASE_COMPONENT,
    },
    ...props.preliminary.getHistories(),
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: StringUtil.trim`
        ## Component to Review

        ${props.prefix !== null ? `**Table Prefix**: \`${props.prefix}\`` : ""}

        ### Target Component

        \`\`\`json
        ${JSON.stringify(props.component)}
        \`\`\`

        ### Tables in Other Components (For Reference)

        These tables belong to OTHER components' domains. Focus on YOUR domain only:

        \`\`\`json
        ${JSON.stringify(props.otherTables)}
        \`\`\`

        ### User Instructions

        ${props.instruction}
      `,
    },
  ],
  userMessage: StringUtil.trim`
    Review the "${props.component.namespace}" component and apply necessary revisions.

    ## Your Task

    1. **Analyze**: Fetch analysis sections using \`getAnalysisSections\` to understand requirements
    2. **Compare**: Review Target Component tables against requirements AND "Tables in Other Components"
    3. **Revise**: Apply CREATE/UPDATE/ERASE to Target Component ONLY

    ## Critical Rules

    **Target Component ONLY**: Your revises affect ONLY the Target Component ("${props.component.namespace}")

    **Reference Other Tables**: Use "Tables in Other Components" to:
    - Check if a table already exists elsewhere (→ do NOT create duplicates)
    - Identify misplaced tables in Target Component (→ ERASE them)

    **Validation Will FAIL If**:
    - You CREATE a table that exists in "Tables in Other Components"
    - You UPDATE a table name to one that exists in "Tables in Other Components"

    ## Revises Operations

    - **Create**: Add missing tables that belong to "${props.component.namespace}" domain
    - **Update**: Fix naming convention issues (snake_case, plural, prefix)
    - **Erase**: Remove tables that belong to other components' domains

    ## Submit

    Call \`process({ request: { type: "complete", review: "...", revises: [...] } })\`

    If no changes needed, submit empty revises array: \`revises: []\`
  `,
});
