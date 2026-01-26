import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

export const transformInterfaceSchemaRefineHistory = (props: {
  state: AutoBeState;
  instruction: string;
  preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "databaseSchemas"
    | "interfaceOperations"
    | "interfaceSchemas"
    | "previousAnalysisFiles"
    | "previousDatabaseSchemas"
    | "previousInterfaceOperations"
    | "previousInterfaceSchemas"
  >;
  typeName: string;
  refineOperations: AutoBeOpenApi.IOperation[];
  originalSchema: AutoBeOpenApi.IJsonSchemaDescriptive;
}): IAutoBeOrchestrateHistory => ({
  histories: [
    {
      type: "systemMessage",
      id: v7(),
      created_at: new Date().toISOString(),
      text: AutoBeSystemPromptConstant.INTERFACE_SCHEMA,
    },
    {
      type: "systemMessage",
      id: v7(),
      created_at: new Date().toISOString(),
      text: AutoBeSystemPromptConstant.INTERFACE_SCHEMA_REFINE,
    },
    ...props.preliminary.getHistories(),
    {
      type: "assistantMessage",
      id: v7(),
      created_at: new Date().toISOString(),
      text: StringUtil.trim`
        ## API Design Instructions

        The following API-specific instructions were extracted from
        the user's requirements. These focus on API interface design aspects
        relevant to the schema refinement task.

        Follow these instructions when analyzing and refining schemas.
        Carefully distinguish between:

        - Suggestions or recommendations (consider these as guidance)
        - Direct specifications or explicit commands (these must be followed exactly)

        When instructions contain direct specifications or explicit design decisions,
        follow them precisely even if you believe you have better alternatives.

        ${props.instruction}
      `,
    },
    {
      id: v7(),
      type: "assistantMessage",
      created_at: new Date().toISOString(),
      text: StringUtil.trim`
        ## Target Type for Refinement Analysis

        You are analyzing the following type alias to determine if it is a
        **degenerate primitive type** that should be refined into a proper
        object schema.

        ### Type Name: \`${props.typeName}\`

        ### Current Schema Definition:

        \`\`\`json
        ${JSON.stringify(props.originalSchema, null, 2)}
        \`\`\`

        ### Operations Using This Type

        The following API operations reference this type. Use this context
        to understand how the type is used:

        \`\`\`json
        ${JSON.stringify(props.refineOperations, null, 2)}
        \`\`\`

        ## Your Task

        Analyze this type using the Chain-of-Thought process:

        1. **Observation**: Document what you see - the current type, JSDoc/description,
           database hints, and naming patterns.

        2. **Reasoning**: Analyze whether the documentation/naming contradicts the
           primitive type. Look for keywords like "key/value", "list of", "contains",
           "mapping", "distribution", "preferences", etc.

        3. **Verdict**: State your conclusion - is this DEGENERATE (needs refinement)
           or INTENTIONAL (valid primitive alias)?

        4. **Schema**: If DEGENERATE, provide the correct object schema.
           If INTENTIONAL, set to null.

        ## Important Guidelines

        - **REFINE** if: Documentation describes a structure (Record, Array, Object)
          but type is primitive.
        - **KEEP** if: This is a valid semantic alias (e.g., \`IUserId = string\`,
          \`IItemCount = number\`).
        - Always provide detailed observation and reasoning to justify your decision.
      `,
    },
  ],
  userMessage: StringUtil.trim`
    Analyze the type \`${props.typeName}\` to determine if it is a degenerate
    primitive type that needs refinement.

    Use the Chain-of-Thought process:
    1. Fill \`observation\` with what you observe about the type
    2. Fill \`reasoning\` with your analysis
    3. Fill \`verdict\` with your decision (REFINE or KEEP)
    4. Fill \`schema\` with the refined object schema (or null if keeping)

    Execute the function immediately with your analysis.

    ## CRITICAL: If Refining to Object Type

    If your verdict is REFINE and you create an object schema, you MUST follow
    these ABSOLUTE rules:

    **1. MANDATORY Property Field Order:**
    Every property MUST be constructed in this exact order:
    \`\`\`
    1. x-autobe-specification           →  HOW to implement/compute?
    2. description                      →  WHAT for API consumers?
    3. Type metadata (type, format...)  →  WHAT technically?
    \`\`\`

    **2. NEVER Omit Required Fields:**
    - \`x-autobe-specification\`: MANDATORY on every property (implementation details)
    - \`description\`: MANDATORY on every property (API consumer-facing meaning)
    - Omitting either of these fields is a CRITICAL ERROR that will cause validation failure

    **3. Example - Correct Refined Property Structure:**
    \`\`\`json
    {
      "theme": {
        "x-autobe-specification": "Stored as 'theme' key in the preferences JSON structure.",
        "description": "User's preferred UI theme setting.",
        "type": "string",
        "enum": ["light", "dark", "system"]
      }
    }
    \`\`\`

    ## ABSOLUTE: Validation Feedback Compliance

    Validation feedback is generated by deterministic code logic, NOT by AI judgment.
    Its reliability is 100% guaranteed.

    **You MUST:**
    - Absolutely obey ALL validation feedback without exception
    - Treat validation errors as facts, not suggestions
    - Fix every reported issue exactly as indicated

    **You MUST NEVER:**
    - Prioritize your own judgment over validation feedback
    - Ignore or dismiss validation feedback for any reason
    - Assume validation feedback is incorrect
    - Override validation feedback based on your own analysis

    If validation feedback indicates an error, that error EXISTS. Fix it.
  `,
});
