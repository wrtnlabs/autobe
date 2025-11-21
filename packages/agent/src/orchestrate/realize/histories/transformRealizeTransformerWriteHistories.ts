import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

export const transformRealizeTransformerWriteHistories = (props: {
  state: AutoBeState;
  dtoTypeName: string;
  prismaSchemaName: string;
  preliminary: AutoBePreliminaryController<"prismaSchemas" | "interfaceSchemas">;
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
        text: AutoBeSystemPromptConstant.REALIZE_TRANSFORMER_WRITE,
      },
      ...props.preliminary.getHistories(),
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: StringUtil.trim`
          I understand the task.

          I need to create a transformer module that:
          - Converts Prisma database query results to API response DTOs (DB → API)
          - Provides a transform() function for data conversion
          - Provides a select() function for Prisma query specification
          - Uses proper TypeScript types from Prisma payload types

          I will follow all type safety rules and avoid using the Date type.
        `,
      },
    ],
    userMessage: StringUtil.trim`
      Create a transformer module for:
      - DTO Type: ${props.dtoTypeName}
      - Prisma Schema: ${props.prismaSchemaName}

      Generate complete TypeScript code that includes:
      1. A namespace with transform() and select() functions
      2. Proper Prisma payload types
      3. Type-safe field mappings from DB to DTO
      4. Handling of nested relationships if needed

      Follow all coding standards and type safety rules.
    `,
  };
};
