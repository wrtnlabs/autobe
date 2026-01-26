import { AutoBeAnalyzeActor, AutoBeDatabaseGroup } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

export const transformPrismaAuthorizationHistory = (props: {
    actor: AutoBeAnalyzeActor;
    prefix: string | null;
    authGroup: AutoBeDatabaseGroup;
    instruction: string;
    preliminary: AutoBePreliminaryController<
      "analysisFiles" | "previousAnalysisFiles" | "previousDatabaseSchemas"
    >;
  },
): IAutoBeOrchestrateHistory => {
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

          - **Filename**: \`${props.authGroup.filename}\`
          - **Namespace**: \`${props.authGroup.namespace}\`

          This group was determined by the Database Group Agent and validated to be
          the single authorization group for this application.

          ---

          ## Prefix Configuration

          ${
            props.prefix
              ? `- Service Prefix: \`${props.prefix}\`
                 - All table names MUST start with: \`${props.prefix}_\`
                 - Example: \`${props.prefix}_${props.actor.name.toLowerCase()}s\`, \`${props.prefix}_${props.actor.name.toLowerCase()}_sessions\``
              : `- No prefix configured
                 - Table names do NOT require a prefix
                 - Example: \`${props.actor.name.toLowerCase()}s\`, \`${props.actor.name.toLowerCase()}_sessions\``
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

          Follow these instructions when designing authorization tables for ${props.actor.name}.
          Carefully distinguish between:
          - Suggestions or recommendations (consider these as guidance)
          - Direct specifications or explicit commands (these must be followed exactly)

          When instructions contain direct specifications or explicit design decisions,
          follow them precisely even if you believe you have better alternatives.

          ${props.instruction}

          ---

          ## Target Actor Information

          You are designing authentication/authorization tables for the following actor:

          \`\`\`json
          ${JSON.stringify(props.actor, null, 2)}
          \`\`\`

          **Actor Details**:
          - **Name**: ${props.actor.name}
          - **Kind**: ${props.actor.kind}
          - **Description**: ${props.actor.description}

          ---

          ## Required Tables

          Based on actor kind "${props.actor.kind}", you MUST create at minimum:

          ${
            props.actor.kind === "guest"
              ? `**Guest Authentication Tables**:
                 1. \`${props.prefix ? props.prefix + "_" : ""}${props.actor.name.toLowerCase()}s\` - Guest actor table with minimal identification fields (no password)
                 2. \`${props.prefix ? props.prefix + "_" : ""}${props.actor.name.toLowerCase()}_sessions\` - Temporary session tokens for guest access`
              : `**${props.actor.kind === "admin" ? "Admin" : "Member"} Authentication Tables**:
                 1. \`${props.prefix ? props.prefix + "_" : ""}${props.actor.name.toLowerCase()}s\` - Actor table with email/password authentication fields
                 2. \`${props.prefix ? props.prefix + "_" : ""}${props.actor.name.toLowerCase()}_sessions\` - JWT session table with access and refresh tokens

                 **Optional Tables** (add if requirements support):
                 - \`${props.prefix ? props.prefix + "_" : ""}${props.actor.name.toLowerCase()}_password_resets\` - For password recovery
                 - \`${props.prefix ? props.prefix + "_" : ""}${props.actor.name.toLowerCase()}_email_verifications\` - For email verification`
          }
        `,
      },
    ],
    userMessage: StringUtil.trim`
      ## Your Task: Design Authorization Tables for ${props.actor.name}

      Create all authentication and authorization related tables for the "${props.actor.name}" actor (kind: "${props.actor.kind}").

      **EXECUTION STEPS**:
      1. If you need authentication requirements, load them via \`getAnalysisFiles\`
      2. Design all required tables based on actor kind
      3. Call \`process({ request: { type: "complete", analysis: "...", rationale: "...", tables: [...] } })\`

      **MANDATORY OUTPUT**:
      - Main actor table: \`${props.prefix ? props.prefix + "_" : ""}${props.actor.name.toLowerCase()}s\`
      - Session table: \`${props.prefix ? props.prefix + "_" : ""}${props.actor.name.toLowerCase()}_sessions\`
      - Any additional auth support tables based on requirements

      Begin execution now. Function calling is MANDATORY.
    `,
  };
};
