import { IAgenticaHistoryJson } from "@agentica/core";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../context/AutoBeState";
import { IAutoBeTestScenarioArtifacts } from "../test/structures/IAutoBeTestScenarioArtifacts";
import { RealizePlannerOutput } from "./orchestrateRealizePlanner";

export const transformRealizeCoderHistories = (
  state: AutoBeState,
  props: RealizePlannerOutput,
  artifacts: IAutoBeTestScenarioArtifacts,
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
      text: [
        AutoBeSystemPromptConstant.REALIZE_CODER,
        "",
        "# Prisma Schemas",
        "```json",
        JSON.stringify(state.prisma.schemas),
        "```",
        "",
        // "# Prisma Types",
        // "```json",
        // JSON.stringify(state.prisma.compiled.nodeModules),
        // "```",
        "# SDK",
        "",
        "The following is the SDK for the API. Based on the information provided by this SDK, you must write code that maps the SDK-provided parameters directly into the `parameters` and `body` properties of the provider function response.",
        "If there are no parameters, define `parameters` as `Record<string, never>`. Similarly, if there is no body, define `body` as `Record<string, never>`.",
        "**Every function must be implemented to accept both `parameters` and `body`, without exception.**",
        "If any required type information is referenced in the SDK, refer to the definitions in the DTO section.",
        "",
        "```json",
        JSON.stringify(artifacts.sdk),
        "```",
        "",
        "# DTO",
        "if you want to import this files, write this: 'import { something } from '../api/structures/something';'",
        "",
        "```json",
        JSON.stringify(artifacts.dto),
        "```",
        "# Document",
        "```json",
        JSON.stringify(artifacts.document),
        "```",
      ].join("\n"),
    },
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: [
        "write code by following information of operation.",
        "```json",
        JSON.stringify(props),
        "```",
      ].join("\n"),
    },
  ];
};
