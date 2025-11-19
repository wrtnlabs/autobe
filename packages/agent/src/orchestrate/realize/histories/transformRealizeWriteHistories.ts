import { IMicroAgenticaHistoryJson } from "@agentica/core";
import { AutoBeOpenApi, AutoBeRealizeAuthorization } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";
import { IAutoBeRealizeScenarioResult } from "../structures/IAutoBeRealizeScenarioResult";
import { getRealizeWriteCodeTemplate } from "../utils/getRealizeWriteCodeTemplate";
import { getRealizeWriteInputType } from "../utils/getRealizeWriteInputType";
import { transformRealizeWriteMembershipHistory } from "./transformRealizeWriteMembershipHistory";

export const transformRealizeWriteHistories = (props: {
  state: AutoBeState;
  scenario: IAutoBeRealizeScenarioResult;
  authorization: AutoBeRealizeAuthorization | null;
  totalAuthorizations: AutoBeRealizeAuthorization[];
  dto: Record<string, string>;
  preliminary: AutoBePreliminaryController<"prismaSchemas">;
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
            "Prisma DB schema generation has not been updated",
            "for the latest requirement analysis.",
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

  const payloads: Record<string, string> = Object.fromEntries(
    props.totalAuthorizations.map((el) => [
      el.payload.location,
      el.payload.content,
    ]),
  );
  const operation: AutoBeOpenApi.IOperation = props.scenario.operation;
  const authorizationHistories: IMicroAgenticaHistoryJson[] =
    operation.authorizationType
      ? transformRealizeWriteMembershipHistory(operation, payloads)
      : [];
  const document: AutoBeOpenApi.IDocument = props.state.interface.document;

  return {
    histories: [
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.REALIZE_WRITE,
      },
      ...props.preliminary.getHistories(),
      ...authorizationHistories,
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.REALIZE_WRITE_ARTIFACT.replaceAll(
          `{input}`,
          getRealizeWriteInputType(operation, props.authorization),
        ).replaceAll(`{artifacts_dto}`, JSON.stringify(props.dto)),
      },
      {
        id: v7(),
        type: "systemMessage",
        created_at: new Date().toISOString(),
        text: getRealizeWriteCodeTemplate({
          authorization: props.authorization,
          scenario: props.scenario,
          schemas: document.components.schemas,
          operation,
        }),
      },
      {
        id: v7(),
        type: "systemMessage",
        created_at: new Date().toISOString(),
        text: StringUtil.trim`
          Write new code based on the following operation.

          \`\`\`json
          ${JSON.stringify(props.scenario)}
          \`\`\`
        `,
      },
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: StringUtil.trim`
          I understand your request.

          To summarize:
          - I must **never use the native \`Date\` type** in any code or type definitions.
          - Instead, all date and datetime values must be handled as \`string & tags.Format<'date-time'>\`.
          - This rule is **strict** and applies everywhere, including domain types, API inputs/outputs, and Prisma models.
          - Even if a library or tool returns a \`Date\`, I must convert it to the correct string format before use.

          Especially regarding the \`Date\` type: I understand that using it can lead to type inconsistency and runtime issues, so I will completely avoid it in all circumstances.

          I'll make sure to follow all these rules strictly. Let's proceed with this in mind.
        `,
      },
    ],
    userMessage: StringUtil.trim`
      Write implementation for ${operation.method.toUpperCase()} ${operation.path} please.

      Write the complete, production-ready TypeScript code that strictly follows these rules:

      DO NOT:
      - Use the native \`Date\` type anywhere
      - Use \`as\` for type assertions

      DO:
      - Write all date/datetime values as \`string & tags.Format<'date-time'>\`
      - Generate UUIDs using \`v4()\` and type as \`string & tags.Format<'uuid'>\`
      - Resolve types properly without assertions
      - Type all functions with clear parameter and return types
      6. Do not skip validations or default values where necessary.
      7. Follow functional, immutable, and consistent code structure.

      Use \`@nestia/e2e\` test structure if relevant.
    `,
  };
};
