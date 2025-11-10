import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { transformInterfaceAssetHistories } from "./transformInterfaceAssetHistories";

export const transformInterfaceSchemaHistories = (props: {
  state: AutoBeState;
  operations: AutoBeOpenApi.IOperation[];
  typeNames: string[];
  instruction: string;
  already: string[];
  remained: Set<string>;
}): IAutoBeOrchestrateHistory => {
  const schemas: Set<string> = new Set();
  for (const op of props.operations) {
    if (op.requestBody) schemas.add(op.requestBody.typeName);
    if (op.responseBody) schemas.add(op.responseBody.typeName);
  }
  return {
    histories: [
      {
        type: "systemMessage",
        id: v7(),
        created_at: new Date().toISOString(),
        text: AutoBeSystemPromptConstant.INTERFACE_SCHEMA,
      },
      ...transformInterfaceAssetHistories(props.state),
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

        Follow these instructions when creating JSON schema components.
        Carefully distinguish between:
        - Suggestions or recommendations (consider these as guidance)
        - Direct specifications or explicit commands (these must be followed exactly)

        When instructions contain direct specifications or explicit design decisions,
        follow them precisely even if you believe you have better alternatives.

        ${props.instruction}

        ## Operations (Filtered for Target Schemas)

        Here is the list of API operations that directly use the schemas
        you need to generate (via requestBody.typeName or responseBody.typeName).

        These are the ONLY operations relevant to your current task - other
        operations have been filtered out to reduce noise and improve focus:

        \`\`\`json
        ${JSON.stringify(props.operations)}
        \`\`\`

        ## Schemas

        Here is the list of request/response bodies' type names from
        OpenAPI operations.

        Reference them when creating DTO schema components, especially
        considering the DTO relationships.

        ${Array.from(schemas)
          .map((k) => `- \`${k}\``)
          .join("\n")}

      `,
      },
    ],
    userMessage: StringUtil.trim`
      Make type components please.

      Here is the list of request/response bodies' type names from
      OpenAPI operations. Make type components of them. If more object
      types are required during making the components, please make them
      too.

      ${Array.from(props.remained)
        .map((k) => `- \`${k}\``)
        .join("\n")}${
        props.already.length !== 0
          ? StringUtil.trim`

            > By the way, here is the list of components schemas what you've
            > already made. So, you don't need to make them again.
            >
            ${props.already.map((k) => `> - \`${k}\``).join("\n")}
          `
          : ""
      }
    `,
  };
};
