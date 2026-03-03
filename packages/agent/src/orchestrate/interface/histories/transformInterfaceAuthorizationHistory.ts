import { AutoBeAnalyzeActor, AutoBeAnalyzeHistory } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { NamingConvention } from "typia/lib/utils/NamingConvention";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";
import { AutoBeInterfaceAuthorizationProgrammer } from "../programmers/AutoBeInterfaceAuthorizationProgrammer";

export const transformInterfaceAuthorizationHistory = (props: {
  state: AutoBeState;
  prefix: string;
  actor: AutoBeAnalyzeActor;
  preliminary: AutoBePreliminaryController<
    | "analysisSections"
    | "databaseSchemas"
    | "previousAnalysisSections"
    | "previousDatabaseSchemas"
  >;
  instruction: string;
}): IAutoBeOrchestrateHistory => {
  const analyze: AutoBeAnalyzeHistory = props.state.analyze!;
  const typeName: string = AutoBeInterfaceAuthorizationProgrammer.getTypeName({
    prefix: props.prefix,
    actor: props.actor.name,
  });
  const table: string = StringUtil.trim`
    Authorization Type | Request Body Type | Response Body Type
    -------------------|-------------------|--------------------
    ${["join", ...(props.actor.kind !== "guest" ? ["login"] : []), "refresh"]
      .map((type) =>
        [
          type,
          `${typeName}.I${NamingConvention.pascal(type)}`,
          `${typeName}.IAuthorized`,
        ].join(" | "),
      )
      .join("\n    ")}
  `;

  return {
    histories: [
      {
        type: "systemMessage",
        id: v7(),
        created_at: new Date().toISOString(),
        text: AutoBeSystemPromptConstant.INTERFACE_AUTHORIZATION,
      },
      ...props.preliminary.getHistories(),
      {
        type: "systemMessage",
        id: v7(),
        created_at: new Date().toISOString(),
        text: StringUtil.trim`
          ## Service Prefix
          - Original: ${analyze.prefix}
          - PascalCase for DTOs: ${analyze.prefix
            .split(/[-_]/)
            .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
            .join("")}
          - Expected DTO pattern: I${analyze.prefix
            .split(/[-_]/)
            .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
            .join("")}{EntityName}
        `,
      },
      {
        type: "assistantMessage",
        id: v7(),
        created_at: new Date().toISOString(),
        text: StringUtil.trim`
          ## API Design Instructions

          The following API-specific instructions were extracted from
          the user's requirements. These focus on API interface design aspects
          such as endpoint patterns, request/response formats, DTO schemas,
          and operation specifications.

          Follow these instructions when designing authorization operations for ${props.actor.name}.
          Carefully distinguish between:
          - Suggestions or recommendations (consider these as guidance)
          - Direct specifications or explicit commands (these must be followed exactly)

          When instructions contain direct specifications or explicit design decisions,
          follow them precisely even if you believe you have better alternatives.

          ${props.instruction}

          ## Actor

          You have to make API operations for the given actor:

          \`\`\`json
          ${JSON.stringify(props.actor)}
          \`\`\`

          ## Authorization Operations Table

          The table below specifies the required authorization operations and their **exact type names**.
          These type names are pre-determined based on the service prefix and actor name - do NOT deviate from them.

          Each column means:
          - **Authorization Type**: The value for \`AutoBeOpenApi.IOperation.authorizationType\` (one of \`"join"\`, \`"login"\`, or \`"refresh"\`)
          - **Request Body Type Name**: The exact DTO type name for \`requestBody.typeName\`
          - **Response Body Type Name**: The exact DTO type name for \`responseBody.typeName\` (always \`IAuthorized\` containing tokens)

          ${table}

          ${
            props.actor.kind === "guest"
              ? "> This actor is `guest` kind, so `login` operation is excluded. Guests authenticate via join/refresh only."
              : ""
          }

          **⚠️ MANDATORY REQUIREMENT**: You MUST generate ALL operations listed in the table above.
          Every single row represents a required operation - do NOT skip or omit any of them.
          The validator will reject your output if any operation is missing.

          When you create each operation's request/response body schemas,
          you MUST use these exact type names. The validator will reject any
          operation that does not match these specifications exactly.
        `,
      },
    ],
    userMessage: `Make authorization operations for ${props.actor.name} actor please`,
  };
};
