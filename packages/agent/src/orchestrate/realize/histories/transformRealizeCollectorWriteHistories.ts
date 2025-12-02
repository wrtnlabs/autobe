import { AutoBeRealizeCollectorPlan } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";
import { AutoBeRealizeCollectorProgrammer } from "../programmers/AutoBeRealizeCollectorProgrammer";

export const transformRealizeCollectorWriteHistories = (props: {
  state: AutoBeState;
  plan: AutoBeRealizeCollectorPlan;
  neighbors: AutoBeRealizeCollectorPlan[];
  preliminary: AutoBePreliminaryController<
    "prismaSchemas" | "interfaceSchemas"
  >;
}): IAutoBeOrchestrateHistory => {
  return {
    histories: [
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.REALIZE_COLLECTOR_WRITE,
      },
      ...props.preliminary.getHistories(),
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: StringUtil.trim`
          ${getDeclaration(props.plan)}

          Here are the neighbor collectors you can utilize.

          Collector Name | DTO Type Name | Prisma Schema Name
          ---------------|---------------|--------------------
          ${props.neighbors
            .map((n) =>
              [
                AutoBeRealizeCollectorProgrammer.getName(n.dtoTypeName),
                n.dtoTypeName,
                n.prismaSchemaName,
              ].join(" | "),
            )
            .join("\n")}
        `,
      },
    ],
    userMessage: StringUtil.trim`
      Create a collector module for the DTO type: ${props.plan.dtoTypeName}

      **Plan Information from REALIZE_COLLECTOR_PLAN phase**:

      - **Prisma Schema Name**: ${props.plan.prismaSchemaName}
      - **Planning Reasoning**: ${props.plan.thinking}

      **Your task**:

      1. Use the provided Prisma schema name: \`${props.plan.prismaSchemaName}\`
      2. Request Prisma schemas to understand the table structure
      3. Request Interface schemas to understand the DTO structure
      4. Analyze field mappings between DTO properties and Prisma columns
      5. Generate complete TypeScript code that includes:
         - A namespace with collect() function
         - Proper Prisma CreateInput types
         - Type-safe field mappings from DTO to DB
         - Handling of nested relationships if needed
         - UUID generation for new records

      Follow all coding standards and type safety rules. The Prisma table name is already determined - use it directly.
    `,
  };
};

function getDeclaration(plan: AutoBeRealizeCollectorPlan): string {
  return StringUtil.trim`
    Here is the declaration of the collector function for 
    the DTO type ${plan.dtoTypeName} and its corresponding
    Prisma schema ${plan.prismaSchemaName}.

    ${
      plan.references.length === 0
        ? ""
        : StringUtil.trim`
          Also, as create DTO ${plan.dtoTypeName} does not include
          every references required for the creation of the ${plan.prismaSchemaName}
          record, you have to accept some references as function
          parameters like below:
        `
    }

    \`\`\`typescript
    ${AutoBeRealizeCollectorProgrammer.getTemplate(plan)}
    \`\`\`
  `;
}
