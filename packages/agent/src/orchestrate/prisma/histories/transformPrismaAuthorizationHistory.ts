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
  const prefix: string | null = props.prefix;
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
            prefix
              ? `- Service Prefix: \`${prefix}\`
                 - All table names MUST start with: \`${prefix}_\`
                 - Example: \`${prefix}_${props.actor.name.toLowerCase()}s\`, \`${prefix}_${props.actor.name.toLowerCase()}_sessions\``
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
                 1. \`${prefix ? prefix + "_" : ""}${props.actor.name.toLowerCase()}s\` - Guest actor table with minimal identification fields (no password)
                 2. \`${prefix ? prefix + "_" : ""}${props.actor.name.toLowerCase()}_sessions\` - Temporary session tokens for guest access`
              : `**${props.actor.kind === "admin" ? "Admin" : "Member"} Authentication Tables**:
                 1. \`${prefix ? prefix + "_" : ""}${props.actor.name.toLowerCase()}s\` - Actor table with email/password authentication fields
                 2. \`${prefix ? prefix + "_" : ""}${props.actor.name.toLowerCase()}_sessions\` - JWT session table with access and refresh tokens

                 **Optional Tables** (add if requirements support):
                 - \`${prefix ? prefix + "_" : ""}${props.actor.name.toLowerCase()}_password_resets\` - For password recovery
                 - \`${prefix ? prefix + "_" : ""}${props.actor.name.toLowerCase()}_email_verifications\` - For email verification`
          }
        `,
      },
    ],
    userMessage: StringUtil.trim`
      ## Your Task: Design Authorization Tables for ${props.actor.name}

      **CRITICAL REQUIREMENT**: You MUST load requirement analysis documents via
      \`getAnalysisFiles\` to identify authentication requirements for this actor.

      **MANDATORY STEPS**:

      1. **FIRST**: Call \`getAnalysisFiles\` to load authentication requirement documents
         - NEVER skip this step - Requirements are the ONLY valid source for authentication design
      2. **THEN**: Analyze the LOADED requirements to design authorization tables for "${props.actor.name}" actor (kind: "${props.actor.kind}")
      3. **FINALLY**: Call \`process({ request: { type: "complete", analysis: "...", rationale: "...", tables: [...] } })\` with complete tables

      **ABSOLUTE PROHIBITIONS**:

      - NEVER generate tables without loading requirement documents first
      - NEVER work from assumptions, imagination, or "typical patterns"
      - NEVER skip loading requirements under any circumstances

      **MANDATORY OUTPUT**:
      - Main actor table: \`${prefix ? prefix + "_" : ""}${props.actor.name.toLowerCase()}s\`
      - Session table: \`${prefix ? prefix + "_" : ""}${props.actor.name.toLowerCase()}_sessions\`
      - Any additional auth support tables based on requirements

      Begin by calling \`getAnalysisFiles\` to load the authentication requirement documents you need to analyze.
    `,
  };
};
