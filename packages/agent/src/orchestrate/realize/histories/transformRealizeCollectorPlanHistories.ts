import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

export const transformRealizeCollectorPlanHistories = (props: {
  state: AutoBeState;
  preliminary: AutoBePreliminaryController<
    "prismaSchemas" | "interfaceSchemas" | "interfaceOperations"
  >;
}): IAutoBeOrchestrateHistory => {
  if (props.state.analyze === null)
    return {
      histories: [
        {
          id: v7(),
          created_at: new Date().toISOString(),
          type: "systemMessage",
          text: [
            "Requirement analysis is not yet completed.",
            "Don't call the any tool function,",
            "but say to process the requirement analysis.",
          ].join(" "),
        },
      ],
      userMessage: "Please wait for prerequisites to complete",
    };
  else if (props.state.prisma === null)
    return {
      histories: [
        {
          id: v7(),
          created_at: new Date().toISOString(),
          type: "systemMessage",
          text: [
            "Prisma DB schema generation is not yet completed.",
            "Don't call the any tool function,",
            "but say to process the Prisma DB schema generation.",
          ].join(" "),
        },
      ],
      userMessage: "Please wait for prerequisites to complete",
    };
  else if (props.state.analyze.step !== props.state.prisma.step)
    return {
      histories: [
        {
          id: v7(),
          created_at: new Date().toISOString(),
          type: "systemMessage",
          text: [
            "Prisma DB schema generation has not been updated",
            "for the latest requirement analysis.",
            "Don't call the any tool function,",
            "but say to re-process the Prisma DB schema generation.",
          ].join(" "),
        },
      ],
      userMessage: "Please wait for prerequisites to complete",
    };
  else if (props.state.prisma.compiled.type !== "success")
    return {
      histories: [
        {
          id: v7(),
          created_at: new Date().toISOString(),
          type: "systemMessage",
          text: [
            "Prisma DB schema generation has failed to compile.",
            "Don't call the any tool function,",
            "but say to re-process the Prisma DB schema generation.",
          ].join(" "),
        },
      ],
      userMessage: "Please wait for prerequisites to complete",
    };
  else if (props.state.interface === null)
    return {
      histories: [
        {
          id: v7(),
          created_at: new Date().toISOString(),
          type: "systemMessage",
          text: [
            "Interface generation is not yet completed.",
            "Don't call the any tool function,",
            "but say to process the interface generation.",
          ].join(" "),
        },
      ],
      userMessage: "Please wait for prerequisites to complete",
    };
  return {
    histories: [
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.REALIZE_COLLECTOR_PLAN,
      },
      ...props.preliminary.getHistories(),
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: StringUtil.trim`
          I understand the task.

          I need to analyze ALL Create DTOs from operations and create a complete plan that determines which collectors to generate.

          **My approach**:
          1. Extract all candidate Create DTOs from operations (including nested Create DTOs)
          2. Request Prisma schemas to understand database structure
          3. Request Interface schemas to understand Create DTO shapes
          4. Request Interface operations to understand how Create DTOs are used
          5. Analyze each Create DTO to determine if it's collectable or not
          6. Generate complete plan including ALL DTOs with appropriate prismaSchemaName

          **For collectable DTOs**: Set prismaSchemaName to actual Prisma table name
          **For non-collectable DTOs**: Set prismaSchemaName to null

          I will include ALL DTOs in the plan with their analysis results.
        `,
      },
    ],
    userMessage: StringUtil.trim`
      Analyze the operation Create DTOs and create a complete collector plan.

      **Your task**:
      1. Identify ALL Create DTO types from operations (including nested Create DTOs)
      2. Request necessary Prisma, Interface schemas, and Operations to understand mappings
      3. Determine which Create DTOs are collectable (map to Prisma tables) vs non-collectable
      4. Generate complete plan including ALL DTOs

      **Remember**:
      - Include ALL DTOs in your plan (both collectable and non-collectable)
      - Collectable DTOs: Set prismaSchemaName to actual Prisma table name
      - Non-collectable DTOs: Set prismaSchemaName to null
      - Analyze nested Create DTOs recursively (tags, inventory, etc.)

      Create the complete plan now.
    `,
  };
};
