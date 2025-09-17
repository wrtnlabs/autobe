import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeRealizeAuthorization } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBeRealizeScenarioResult } from "../structures/IAutoBeRealizeScenarioResult";
import { getRealizeWriteCodeTemplate } from "../utils/getRealizeWriteCodeTemplate";
import { getRealizeWriteInputType } from "../utils/getRealizeWriteInputType";
import { transformRealizeWriteAuthorizationsHistories } from "./transformRealizeWriteAuthorizationsHistories";

export const transformRealizeWriteHistories = (props: {
  state: AutoBeState;
  scenario: IAutoBeRealizeScenarioResult;
  authorization: AutoBeRealizeAuthorization | null;
  totalAuthorizations: AutoBeRealizeAuthorization[];
  dto: Record<string, string>;
}): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  const payloads = Object.fromEntries(
    props.totalAuthorizations.map((el) => [
      el.payload.location,
      el.payload.content,
    ]),
  );

  const operation = props.scenario.operation;

  if (props.state.analyze === null)
    return [
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
    ];
  else if (props.state.prisma === null)
    return [
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
    ];
  else if (props.state.analyze.step !== props.state.prisma.step)
    return [
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
    ];
  else if (props.state.prisma.compiled.type !== "success")
    return [
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
    ];
  else if (props.state.interface === null)
    return [
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
    ];

  // Get authorization-specific histories if authorizationType is set
  const authorizationHistories = operation.authorizationType
    ? transformRealizeWriteAuthorizationsHistories(operation, payloads)
    : [];

  return [
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.REALIZE_WRITE,
    },
    ...authorizationHistories,
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.REALIZE_WRITE_ARTIFACT.replaceAll(
        `{prismaSchemas}`,
        JSON.stringify(props.state.prisma.schemas),
      )
        .replaceAll(
          `{input}`,
          getRealizeWriteInputType(operation, props.authorization),
        )
        .replaceAll(`{artifacts_dto}`, JSON.stringify(props.dto)),
    },
    {
      id: v7(),
      type: "systemMessage",
      created_at: new Date().toISOString(),
      text: getRealizeWriteCodeTemplate(
        props.scenario,
        operation,
        props.authorization,
      ),
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
  ];
};
