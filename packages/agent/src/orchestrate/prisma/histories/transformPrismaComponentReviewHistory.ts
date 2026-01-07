import { AutoBeDatabaseComponent } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

export const transformPrismaComponentReviewHistory = (props: {
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
      text: AutoBeSystemPromptConstant.DATABASE_COMPONENT,
    },
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.DATABASE_COMPONENT_REVIEW,
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

        - **Namespace**: \`${props.component.namespace}\`
        - **Filename**: \`${props.component.filename}\`

        ### Current Tables

        The following tables are currently assigned to this component:

        ${JSON.stringify(props.component.tables, null, 2)}

        ### All Tables in System (Other Components)

        These table names exist in other components. You CANNOT create tables with these names:

        ${JSON.stringify(props.allTableNames.filter((t) => !props.component.tables.some((ct) => ct.name === t)).sort())}

        ### User Instructions

        ${props.instruction}
      `,
    },
  ],
  userMessage: StringUtil.trim`
    Review the "${props.component.namespace}" component's table list and apply necessary revisions.

    1. First, fetch analysis files using \`getAnalysisFiles\` to understand requirements
    2. Identify issues: missing tables, naming problems, or misplaced tables
    3. Call \`process({ request: { type: "complete", revises: [...] } })\` with your revisions

    Use revises to:
    - **Create**: Add missing tables that requirements need
    - **Update**: Rename tables with naming convention issues
    - **Erase**: Remove tables that belong to other components

    If no changes are needed, return an empty revises array.
  `,
});
