import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

export const transformRealizeTransformerWriteHistories = (props: {
  state: AutoBeState;
  dtoTypeName: string;
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
        text: AutoBeSystemPromptConstant.REALIZE_TRANSFORMER_WRITE,
      },
      ...props.preliminary.getHistories(),
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: StringUtil.trim`
          I understand the task.

          I need to either create a transformer module OR reject if incompatible:

          **If the DTO maps to a Prisma table**:
          - Create transformer module that converts Prisma results to API DTOs (DB → API)
          - Provide transform() function for data conversion
          - Provide select() function for Prisma query specification
          - Use proper TypeScript types from Prisma payload types

          **If the DTO is incompatible** (request param, business logic type):
          - Reject with type: "reject" and clear reason
          - Explain why no Prisma mapping exists

          I will follow all type safety rules and avoid using the Date type.
        `,
      },
    ],
    userMessage: StringUtil.trim`
      Create a transformer module for the DTO type: ${props.dtoTypeName}

      **Step 1: Determine transformer eligibility**

      First, check if this DTO type actually needs a transformer:
      - Does it represent database-backed data that maps to a Prisma table?
      - Or is it a request parameter, business logic type, or computed type?

      **If incompatible** (request param like IPage.IRequest, business logic type like IAuthorizationToken):
      - Call process() with type: "reject" immediately
      - Provide clear reason explaining why no Prisma mapping exists

      **If transformable**, proceed to analyze:

      1. Which Prisma table/model corresponds to this DTO type
      2. The field mappings between Prisma columns and DTO properties

      Then generate complete TypeScript code that includes:

      1. A namespace with transform() and select() functions
      2. Proper Prisma payload types
      3. Type-safe field mappings from DB to DTO
      4. Handling of nested relationships if needed

      Follow all coding standards and type safety rules.
    `,
  };
};
