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
  total: IAutoBeTypeScriptCompileResult.IDiagnostic[],
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
      text: AutoBeSystemPromptConstant.REALIZE_CODER,
    },
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.REALIZE_CODER_TYPESCRIPT,
    },
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.REALIZE_CODER_PRISMA,
    },
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.REALIZE_CODER_BROWSER,
    },
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.REALIZE_CODER_TYPIA,
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
        .replaceAll(`{artifacts_document}`, JSON.stringify(artifacts.document)),
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
              .replaceAll("{total_diagnostics}", JSON.stringify(total))
              .replaceAll("{current_diagnostics}", JSON.stringify(diagnostics)),
          } as const,
        ]
      : []),
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: [
        previous
          ? "Modify the previous code to reflect the following operation."
          : "Write new code based on the following operation.",
        "```json",
        JSON.stringify(props),
        "```",
      ].join("\n"),
    },
  ];
};
