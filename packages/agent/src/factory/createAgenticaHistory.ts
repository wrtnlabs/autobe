import {
  AgenticaExecuteHistory,
  AgenticaOperation,
  AgenticaUserMessageContent,
  IAgenticaHistoryJson,
  MicroAgenticaHistory,
} from "@agentica/core";
import {
  AutoBeAssistantMessageHistory,
  AutoBeHistory,
} from "@autobe/interface";

export function createAgenticaHistory(props: {
  operations: readonly AgenticaOperation[];
  history: AutoBeHistory;
}): MicroAgenticaHistory | null {
  if (props.history.type === "userMessage") {
    // @todo Seems to need more explanation that
    //       this is not a pure text
    //       but a text by analyzing an image
    const history: IAgenticaHistoryJson.IUserMessage = {
      ...props.history,
      contents: props.history.contents.map((c) => {
        if (c.type === "image") {
          return {
            type: "text",
            text: c.description,
          } satisfies AgenticaUserMessageContent;
        } else return c;
      }),
    };
    return { ...history, toJSON: () => history };
  } else if (props.history.type === "assistantMessage")
    return {
      ...props.history,
      toJSON: () => props.history as AutoBeAssistantMessageHistory,
    };

  const operation: AgenticaOperation | undefined = props.operations.find(
    (op) => op.function.name === props.history.type,
  );
  if (operation === undefined) return null;
  const partial = {
    id: props.history.id,
    created_at: props.history.created_at,
    type: "execute" as const,
    arguments: {
      instruction:
        props.history.type === "analyze"
          ? undefined
          : props.history.instruction,
    },
    value: {
      success:
        props.history.type === "analyze" || props.history.type === "interface"
          ? true
          : props.history.compiled.type === "success",
    },
    success: true,
  } satisfies Partial<AgenticaExecuteHistory>;
  return {
    ...partial,
    protocol: operation.protocol as "class",
    operation: operation as AgenticaOperation.Class,
    toJSON: () => ({
      ...partial,
      protocol: operation.protocol as "class",
      operation: operation.toJSON(),
    }),
  } satisfies AgenticaExecuteHistory;
}
