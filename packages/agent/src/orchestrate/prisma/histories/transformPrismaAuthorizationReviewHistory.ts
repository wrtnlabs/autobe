import { AutoBeAnalyzeActor, AutoBeDatabaseComponent } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { plural } from "pluralize";
import { NamingConvention } from "typia/lib/utils/NamingConvention";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

export const transformPrismaAuthorizationReviewHistory = (props: {
  preliminary: AutoBePreliminaryController<
    "analysisSections" | "previousAnalysisSections" | "previousDatabaseSchemas"
  >;
  component: AutoBeDatabaseComponent;
  actors: AutoBeAnalyzeActor[];
  instruction: string;
  prefix: string | null;
}): IAutoBeOrchestrateHistory => {
  const prefix: string = props.prefix ? `${props.prefix}_` : "";

  const requiredTables: string = props.actors
    .map((actor) => {
      const actorName: string = NamingConvention.snake(actor.name);
      return `- **${actor.name}**: \`${prefix}${plural(actorName)}\` + \`${prefix}${actorName}_sessions\``;
    })
    .join("\n");

  return {
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

          ### Actors to Cover

          The following actors must ALL have authentication tables:

          \`\`\`json
          ${JSON.stringify(props.actors)}
          \`\`\`

          ### Required Tables (Minimum)

          Each actor MUST have at least:
          ${requiredTables}

          ### Current Tables

          The following tables are currently assigned to this authorization component:

          \`\`\`json
          ${JSON.stringify(props.component.tables)}
          \`\`\`

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

      **IMPORTANT - All Actors Must Be Covered**:
      Verify that EVERY actor has: main actor table + session table + auth support tables.

      Use revises to:
      - **Create**: Add missing authentication tables (session tables, password reset, etc.)
      - **Update**: Rename tables with naming convention issues
      - **Erase**: Remove tables that are not related to authentication/authorization

      When ready, call \`process({ request: { type: "complete", revises: [...] } })\` with your revisions.
      If no changes are needed, return an empty revises array.
    `,
  };
};
