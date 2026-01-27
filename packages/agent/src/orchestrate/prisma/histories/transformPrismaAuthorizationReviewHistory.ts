import { AutoBeDatabaseComponent } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

export const transformPrismaAuthorizationReviewHistory = (props: {
  preliminary: AutoBePreliminaryController<
    "analysisFiles" | "previousAnalysisFiles" | "previousDatabaseSchemas"
  >;
  component: AutoBeDatabaseComponent;
  allTableNames: string[];
  instruction: string;
  prefix: string | null;
}): IAutoBeOrchestrateHistory => ({
  histories: [
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.DATABASE_AUTHORIZATION,
    },
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.DATABASE_AUTHORIZATION_REVIEW,
    },
    ...props.preliminary.getHistories(),
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: StringUtil.trim`
        ## Authorization Component to Review

        ${props.prefix !== null ? `**Table Prefix**: \`${props.prefix}\`` : ""}

        ### Target Component

        - **Namespace**: \`${props.component.namespace}\`
        - **Filename**: \`${props.component.filename}\`

        ### Current Tables

        The following tables are currently assigned to this authorization component:

        ${JSON.stringify(props.component.tables, null, 2)}

        ### Tables in Other Components (For Reference)

        These tables belong to OTHER components' domains. Focus on YOUR authorization domain only:

        ${JSON.stringify(props.allTableNames.filter((t) => !props.component.tables.some((ct) => ct.name === t)).sort())}

        ### User Instructions

        ${props.instruction}
      `,
    },
  ],
  userMessage: StringUtil.trim`
    Review the "${props.component.namespace}" authorization component's table list and apply necessary revisions.

    **IMPORTANT - Authorization Domain Rule**:
    Only CREATE tables related to authentication and authorization.
    Do NOT create business domain tables (orders, products, etc.).

    1. First, fetch analysis files using \`getAnalysisFiles\` to understand authentication requirements
    2. Verify each actor has: main actor table + session table + auth support tables
    3. Call \`process({ request: { type: "complete", revises: [...] } })\` with your revisions

    Use revises to:
    - **Create**: Add missing authentication tables (session tables, password reset, etc.)
    - **Update**: Rename tables with naming convention issues
    - **Erase**: Remove tables that are not related to authentication/authorization

    If no changes are needed, return an empty revises array.
  `,
});
