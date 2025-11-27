import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

export const transformRealizeTransformerPlanHistories = (props: {
  state: AutoBeState;
  preliminary: AutoBePreliminaryController<
    "prismaSchemas" | "interfaceSchemas"
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
        text: AutoBeSystemPromptConstant.REALIZE_TRANSFORMER_PLAN,
      },
      ...props.preliminary.getHistories(),
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: StringUtil.trim`
          I understand the task.

          I need to analyze ALL DTOs from the operation response and create a complete plan that determines which transformers to generate.

          **My approach**:
          1. Extract all candidate DTOs from operation response (including nested DTOs)
          2. Request Prisma schemas to understand database structure
          3. Request Interface schemas to understand DTO shapes
          4. Analyze each DTO to determine if it's transformable or not
          5. Generate complete plan including ALL DTOs with appropriate prismaSchemaName

          **For transformable DTOs**: Set prismaSchemaName to actual Prisma table name
          **For non-transformable DTOs**: Set prismaSchemaName to null

          I will include ALL DTOs in the plan with their analysis results.
        `,
      },
    ],
    userMessage: StringUtil.trim`
      Analyze the operation response DTOs and create a complete transformer plan.

      **Your task**:
      1. Identify ALL DTO types from the operation response (including nested DTOs)
      2. Request necessary Prisma and Interface schemas to understand mappings
      3. Determine which DTOs are transformable (map to Prisma tables) vs non-transformable
      4. Generate complete plan including ALL DTOs

      **Remember**:
      - Include ALL DTOs in your plan (both transformable and non-transformable)
      - Transformable DTOs: Set prismaSchemaName to actual Prisma table name
      - Non-transformable DTOs: Set prismaSchemaName to null
      - Analyze nested DTOs recursively (category, tags, etc.)

      Create the complete plan now.
    `,
  };
};
