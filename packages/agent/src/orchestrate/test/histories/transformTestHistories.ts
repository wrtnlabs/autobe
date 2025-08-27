import { IAgenticaHistoryJson } from "@agentica/core";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeState } from "../../../context/AutoBeState";

export const transformTestHistories = (
  state: AutoBeState,
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  if (state.analyze === null)
    return [
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: StringUtil.trim`
          Requirement analysis is not yet completed.
          Don't call the any tool function,
          but say to process the requirement analysis.
        `,
      },
    ];
  else if (state.prisma === null)
    return [
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: StringUtil.trim`
          Prisma DB schema generation is not yet completed.
          Don't call the any tool function,
          but say to process the Prisma DB schema generation.
        `,
      },
    ];
  else if (state.analyze.step !== state.prisma.step)
    return [
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: StringUtil.trim`
          Prisma DB schema generation has not been updated
          for the latest requirement analysis.
          Don't call the any tool function,
          but say to re-process the Prisma DB schema generation.
        `,
      },
    ];
  else if (state.prisma.compiled.type !== "success")
    return [
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: StringUtil.trim`
          Prisma DB schema generation has not been updated
          for the latest requirement analysis.
          Don't call the any tool function,
          but say to re-process the Prisma DB schema generation.
        `,
      },
    ];
  return [
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: StringUtil.trim`
        Interface generation is not yet completed.
        Don't call the any tool function,
        but say to process the interface generation.
      `,
    },
  ];
};