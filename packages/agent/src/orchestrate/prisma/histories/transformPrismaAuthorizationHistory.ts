import { AutoBeAnalyze, AutoBeDatabaseGroup } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { NamingConvention } from "@typia/utils";
import { plural } from "pluralize";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

export const transformPrismaAuthorizationHistory = (props: {
  actors: AutoBeAnalyze.IActor[];
  prefix: string | null;
  group: AutoBeDatabaseGroup;
  instruction: string;
  preliminary: AutoBePreliminaryController<
    "analysisSections" | "previousAnalysisSections" | "previousDatabaseSchemas"
  >;
}): IAutoBeOrchestrateHistory => {
  const prefix: string = props.prefix ? `${props.prefix}_` : "";

  const requiredTables: string = props.actors
    .map((actor) => {
      const actorName: string = NamingConvention.snake(actor.name);
      if (actor.kind === "guest") {
        return StringUtil.trim`
          ### ${actor.name} (${actor.kind})
          1. \`${prefix}${plural(actorName)}\` - Guest actor table with minimal identification fields (no password)
          2. \`${prefix}${actorName}_sessions\` - Temporary session tokens for guest access
        `;
      } else {
        return StringUtil.trim`
          ### ${actor.name} (${actor.kind})
          1. \`${prefix}${plural(actorName)}\` - Actor table with email/password authentication fields
          2. \`${prefix}${actorName}_sessions\` - JWT session table with access and refresh tokens

          **Optional Tables** (add if requirements support):
          - \`${prefix}${actorName}_password_resets\` - For password recovery
          - \`${prefix}${actorName}_email_verifications\` - For email verification
        `;
      }
    })
    .join("\n\n");

  const mandatoryOutput: string = props.actors
    .map((actor) => {
      const actorName: string = NamingConvention.snake(actor.name);
      return StringUtil.trim`
        - **${actor.name}**: \`${prefix}${plural(actorName)}\` + \`${prefix}${actorName}_sessions\`
      `;
    })
    .join("\n");

  return {
    histories: [
      {
        type: "systemMessage",
        id: v7(),
        created_at: new Date().toISOString(),
        text: AutoBeSystemPromptConstant.DATABASE_AUTHORIZATION,
      },
      ...props.preliminary.getHistories(),
      {
        type: "systemMessage",
        id: v7(),
        created_at: new Date().toISOString(),
        text: StringUtil.trim`
          ## Authorization Group Configuration

          Your tables will be placed in the following authorization group:

          - **Filename**: \`${props.group.filename}\`
          - **Namespace**: \`${props.group.namespace}\`

          This group was determined by the Database Group Agent and validated to be
          the single authorization group for this application.

          ---

          ## Prefix Configuration

          ${
            props.prefix !== null
              ? `- Service Prefix: \`${props.prefix}\`
                 - All table names MUST start with: \`${prefix}\``
              : `- No prefix configured
                 - Table names do NOT require a prefix`
          }
        `,
      },
      {
        type: "assistantMessage",
        id: v7(),
        created_at: new Date().toISOString(),
        text: StringUtil.trim`
          ## Database Design Instructions

          The following database-specific instructions were extracted from the user's
          requirements. These focus on database design aspects such as table naming,
          field patterns, and authentication requirements.

          Follow these instructions when designing authorization tables for ALL actors.
          Carefully distinguish between:
          - Suggestions or recommendations (consider these as guidance)
          - Direct specifications or explicit commands (these must be followed exactly)

          When instructions contain direct specifications or explicit design decisions,
          follow them precisely even if you believe you have better alternatives.

          ${props.instruction}

          ---

          ## Target Actors Information

          You are designing authentication/authorization tables for ALL of the following actors:

          \`\`\`json
          ${JSON.stringify(props.actors)}
          \`\`\`

          ---

          ## Required Tables for Each Actor

          You MUST create tables for EVERY actor listed above. Here are the minimum required tables:

          ${requiredTables}
        `,
      },
    ],
    userMessage: StringUtil.trim`
      ## Your Task: Design Authorization Tables for ALL Actors

      Design authentication and authorization tables for every actor in the system.

      **MANDATORY OUTPUT** (for each actor, at minimum):
      ${mandatoryOutput}
      - Plus any additional auth support tables based on requirements

      When ready, call \`process({ request: { type: "complete", analysis: "...", rationale: "...", tables: [...] } })\` with complete tables for ALL actors.
    `,
  };
};
