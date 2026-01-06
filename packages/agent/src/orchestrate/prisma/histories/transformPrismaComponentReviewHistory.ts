import { AutoBeDatabase } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

export const transformPrismaComponentReviewHistory = (props: {
  preliminary: AutoBePreliminaryController<
    "analysisFiles" | "previousAnalysisFiles" | "previousDatabaseSchemas"
  >;
  component: AutoBeDatabase.IComponent;
  allTables: string[];
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
        ## Component to Enrich

        ${props.prefix !== null ? `**Table Prefix**: \`${props.prefix}\`` : ""}

        ### Target Component

        - **Namespace**: \`${props.component.namespace}\`
        - **Current Tables**: ${JSON.stringify(props.component.tables)}

        ### All Tables in System

        ${JSON.stringify(props.allTables.sort())}

        ### User Instructions

        ${props.instruction}
      `,
    },
  ],
  userMessage: StringUtil.trim`
    Analyze requirements for the "${props.component.namespace}" component and enrich its table list.

    1. First, fetch analysis files using \`getAnalysisFiles\` to understand requirements
    2. Identify missing tables based on feature requirements
    3. Call \`process({ request: { type: "complete", ... } })\` with the enriched table list
  `,
});
