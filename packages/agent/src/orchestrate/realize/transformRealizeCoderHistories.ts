import { IAgenticaHistoryJson } from "@agentica/core";
import { IAutoBeTypeScriptCompileResult } from "@autobe/interface";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../context/AutoBeState";
import { IAutoBeTestScenarioArtifacts } from "../test/structures/IAutoBeTestScenarioArtifacts";
import { RealizePlannerOutput } from "./orchestrateRealizePlanner";

export const transformRealizeCoderHistories = (
  state: AutoBeState,
  props: RealizePlannerOutput,
  artifacts: IAutoBeTestScenarioArtifacts,
  previous: string | null,
  diagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[],
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  if (state.analyze === null)
    return [
      {
        id: v4(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: [
          "Requirement analysis is not yet completed.",
          "Don't call the any tool function,",
          "but say to process the requirement analysis.",
        ].join(" "),
      },
    ];
  else if (state.prisma === null)
    return [
      {
        id: v4(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: [
          "Prisma DB schema generation is not yet completed.",
          "Don't call the any tool function,",
          "but say to process the Prisma DB schema generation.",
        ].join(" "),
      },
    ];
  else if (state.analyze.step !== state.prisma.step)
    return [
      {
        id: v4(),
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
  else if (state.prisma.compiled.type !== "success")
    return [
      {
        id: v4(),
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
  else if (state.interface === null)
    return [
      {
        id: v4(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: [
          "Interface generation is not yet completed.",
          "Don't call the any tool function,",
          "but say to process the interface generation.",
        ].join(" "),
      },
    ];

  return [
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.REALIZE_CODER_TOTAL,
    },
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: props.decoratorEvent
        ? [
            "Decorator-related files are already generated at the following locations:",
            `- Decorator implementation: decorators/${props.decoratorEvent.decorator.name}.ts`,
            `  - NestJS parameter decorator`,
            `  - When importing from providers folder, use: '../decorators/${props.decoratorEvent.decorator.name}'`,
            `- Authentication provider: authentications/${props.decoratorEvent.provider.name}.ts`,
            `  - Contains JWT validation, role checking, and authorization logic`,
            `  - When importing from providers folder, use: '../authentications/${props.decoratorEvent.provider.name}'`,
            `- Type definition: authentications/types/${props.decoratorEvent.payload.name}.ts`,
            `  - TypeScript interface for authenticated user payload`,
            `  - When importing from providers folder, use: '../authentications/types/${props.decoratorEvent.payload.name}'`,
          ].join("\n")
        : "",
    },
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.REALIZE_CODER_ARTIFACT.replaceAll(
        `{prisma_schemas}`,
        JSON.stringify(state.prisma.schemas),
      )
        .replaceAll(`{artifacts_sdk}`, JSON.stringify(artifacts.sdk))
        .replaceAll(`{artifacts_dto}`, JSON.stringify(artifacts.dto)),
      // .replaceAll(`{artifacts_document}`, JSON.stringify(artifacts.document)),
    },
    ...(previous !== null
      ? [
          {
            id: v4(),
            created_at: new Date().toISOString(),
            type: "assistantMessage",
            text: AutoBeSystemPromptConstant.REALIZE_CODER_DIAGNOSTICS.replaceAll(
              `{code}`,
              previous,
            )
              // .replaceAll("{total_diagnostics}", JSON.stringify(total))
              .replaceAll("{current_diagnostics}", JSON.stringify(diagnostics)),
          } as const,
          {
            id: v4(),
            created_at: new Date().toISOString(),
            type: "systemMessage",
            text: [
              "Modify the previous code to reflect the following operation.",
              "```json",
              JSON.stringify(props),
              "```",
            ].join("\n"),
          } as const,
        ]
      : [
          {
            id: v4(),
            created_at: new Date().toISOString(),
            type: "systemMessage",
            text: [
              "Write new code based on the following operation.",
              "```json",
              JSON.stringify(props),
              "```",
            ].join("\n"),
          } as const,
        ]),
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: [
        `I understand your request.`,
        ``,
        `To summarize:`,
        `- I must **never use the native \`Date\` type** in any code or type definitions.`,
        `- Instead, all date and datetime values must be handled as \`string & tags.Format<'date-time'>\`.`,
        `- This rule is **strict** and applies everywhere, including domain types, API inputs/outputs, and Prisma models.`,
        `- Even if a library or tool returns a \`Date\`, I must convert it to the correct string format before use.`,
        ``,
        `Especially regarding the \`Date\` type: I understand that using it can lead to type inconsistency and runtime issues, so I will completely avoid it in all circumstances.`,
        ``,
        `I'll make sure to follow all these rules strictly. Let’s proceed with this in mind.`,
      ].join("\n"),
    },
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: [
        `I understand your request.`,
        ``,
        `To summarize:`,
        `- I must **never use the native \`Date\` type** in any code or type definitions.`,
        `- Instead, all date and datetime values must be handled as \`string & tags.Format<'date-time'>\`.`,
        `- This rule is **strict** and applies everywhere, including domain types, API inputs/outputs, and Prisma models.`,
        `- Even if a library or tool returns a \`Date\`, I must convert it to the correct string format before use.`,
        ``,
        `Especially regarding the \`Date\` type: I understand that using it can lead to type inconsistency and runtime issues, so I will completely avoid it in all circumstances.`,
        ``,
        `I'll make sure to follow all these rules strictly. Let’s proceed with this in mind.`,
      ].join("\n"),
    },
  ];
};
