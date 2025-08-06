import { IAgenticaHistoryJson } from "@agentica/core";
import {
  AutoBeRealizeAuthorization,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBeTestScenarioArtifacts } from "../../test/structures/IAutoBeTestScenarioArtifacts";
import { RealizePlannerOutput } from "../orchestrateRealizePlanner";
import { IAutoBeRealizeCompile } from "../structures/IAutoBeRealizeCompile";

export const transformRealizeCoderHistories = (
  state: AutoBeState,
  previousCodes: IAutoBeRealizeCompile.Success[],
  props: RealizePlannerOutput,
  artifacts: IAutoBeTestScenarioArtifacts,
  previous: string | null,
  diagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[],
  authorization?: AutoBeRealizeAuthorization,
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  const [operation] = artifacts.document.operations;

  const propsFields: string[] = [];

  // payload 추가
  if (authorization && operation.authorizationRole) {
    propsFields.push(
      `${operation.authorizationRole}: ${authorization.payload.name};`,
    );
  }

  // parameters 추가
  operation.parameters.forEach((parameter) => {
    const format =
      "format" in parameter.schema
        ? ` & tags.Format<'${parameter.schema.format}'>`
        : "";
    propsFields.push(`${parameter.name}: ${parameter.schema.type}${format};`);
  });

  // body 추가
  if (operation.requestBody?.typeName) {
    propsFields.push(`body: ${operation.requestBody.typeName};`);
  }

  const input =
    propsFields.length > 0
      ? `props: {\n${propsFields.map((field) => `  ${field}`).join("\n")}\n}`
      : `// No props parameter needed - function should have no parameters`;

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
      text: AutoBeSystemPromptConstant.REALIZE_CODER_ARTIFACT.replaceAll(
        `{prisma_schemas}`,
        JSON.stringify(state.prisma.schemas),
      )
        .replaceAll(`{artifacts_sdk}`, JSON.stringify(artifacts.sdk))
        .replaceAll(`{artifacts_dto}`, JSON.stringify(artifacts.dto))
        .replaceAll(`{input}`, input),
    },
    ...(previous !== null
      ? [
          {
            id: v4(),
            created_at: new Date().toISOString(),
            type: "assistantMessage",
            text: [
              "These values contain previously generated code and thought flow.",
              "All of these codes are failed compilation values.",
              previousCodes.length >= 2
                ? "🚨 CRITICAL: You have already failed " +
                  previousCodes.length +
                  " times. The current approach is FUNDAMENTALLY WRONG!"
                : "Please refer to the code for writing a new code.",
              previousCodes.length >= 2
                ? [
                    "",
                    "After multiple failures, you MUST make AGGRESSIVE changes:",
                    "1. COMPLETELY REWRITE the problematic parts - don't just tweak",
                    "2. Try a DIFFERENT algorithm or approach entirely",
                    "3. Question ALL your assumptions about the requirements",
                    "4. Consider alternative Prisma patterns or query structures",
                    "5. The error might be in your fundamental understanding - rethink everything",
                  ].join("\n")
                : "",
              "",
              "```json",
              JSON.stringify(
                previousCodes.map((c) => c.result.implementationCode),
              ),
              "```",
            ]
              .filter(Boolean)
              .join("\n"),
          } as const,
          {
            id: v4(),
            created_at: new Date().toISOString(),
            type: "assistantMessage",
            text: AutoBeSystemPromptConstant.REALIZE_CODER_DIAGNOSTICS.replaceAll(
              `{code}`,
              previous,
            ).replaceAll("{current_diagnostics}", JSON.stringify(diagnostics)),
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
