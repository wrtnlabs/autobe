import { IAgenticaHistoryJson } from "@agentica/core";
import { v7 } from "uuid";

import { AutoBeState } from "../../../context/AutoBeState";

export const transformInterfaceCommonHistory = (
  state: AutoBeState,
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> | null => {
  if (state.analyze === null)
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
  else if (state.database === null)
    return [
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: [
          "Database schema generation is not yet completed.",
          "Don't call the any tool function,",
          "but say to process the database schema generation.",
        ].join(" "),
      },
    ];
  else if (state.analyze.step !== state.database.step)
    return [
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: [
          "Database schema generation has not been updated",
          "for the latest requirement analysis.",
          "Don't call the any tool function,",
          "but say to re-process the database schema generation.",
        ].join(" "),
      },
    ];
  else if (state.database.compiled.type !== "success")
    return [
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: [
          "Database schema generation has not been updated",
          "for the latest requirement analysis.",
          "Don't call the any tool function,",
          "but say to re-process the database schema generation.",
        ].join(" "),
      },
    ];
  return null;
};
