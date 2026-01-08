import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

export const transformPrismaGroupHistory = (
  state: AutoBeState,
  props: {
    instruction: string;
    preliminary: AutoBePreliminaryController<
      "analysisFiles" | "previousAnalysisFiles" | "previousDatabaseSchemas"
    >;
  },
): IAutoBeOrchestrateHistory => {
  if (state.analyze === null)
    // unreachable
    throw new Error("Analyze state is not set.");
  return {
    histories: [
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.DATABASE_GROUP,
      },
      ...props.preliminary.getHistories(),
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: StringUtil.trim`
          ## Database Design Instructions

          The following database-specific instructions were extracted from
          the user's requirements. These focus on database schema design aspects
          such as component organization, domain grouping, and structural patterns.

          Follow these instructions when organizing database component groups.
          Carefully distinguish between:
          - Suggestions or recommendations (consider these as guidance)
          - Direct specifications or explicit commands (these must be followed exactly)

          When instructions contain direct specifications or explicit design decisions,
          follow them precisely even if you believe you have better alternatives.

          ${props.instruction}
        `,
      },
    ],
    userMessage: StringUtil.trim`
      ## Your Task: Organize Database Components into Logical Groups

      **CRITICAL REQUIREMENT**: You MUST load requirement analysis documents via 
      \`getAnalysisFiles\` to identify all business domains.

      **MANDATORY STEPS**:
      1. **FIRST**: Call \`getAnalysisFiles\` to load requirement documents
         - NEVER skip this step - Requirements are the ONLY valid source for domain identification
      2. **THEN**: Analyze the LOADED requirements to identify all business domains and entities
      3. **FINALLY**: Generate complete component groups covering ALL domains found in requirements

      **ABSOLUTE PROHIBITIONS**:

      - ❌ NEVER generate component groups without loading requirement documents first
      - ❌ NEVER work from assumptions, imagination, or "typical patterns"
      - ❌ NEVER skip loading requirements under any circumstances

      Begin by calling \`getAnalysisFiles\` to load the requirement documents you need to analyze.
    `,
  };
};
