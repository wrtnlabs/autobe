import { AgenticaOperation, MicroAgenticaHistory } from "@agentica/core";
import {
  AutoBeAssistantMessageHistory,
  AutoBeHistory,
  AutoBeUserMessageHistory,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

export function createAgenticaHistory<Model extends ILlmSchema.Model>(props: {
  operations: readonly AgenticaOperation<Model>[];
  history: AutoBeHistory;
}): MicroAgenticaHistory<Model> | null {
  if (props.history.type === "userMessage")
    return {
      ...props.history,
      toJSON: () => props.history as AutoBeUserMessageHistory,
    };
  else if (props.history.type === "assistantMessage")
    return {
      ...props.history,
      toJSON: () => props.history as AutoBeAssistantMessageHistory,
    };

  const operation: AgenticaOperation<Model> | undefined = props.operations.find(
    (op) => op.function.name === props.history.type,
  );
  if (operation === undefined) return null;
  const partial = {
    id: props.history.id,
    created_at: props.history.created_at,
    type: "execute" as const,
    arguments: {
      reason: props.history.reason,
    },
    value: {
      success:
        props.history.type === "analyze" || props.history.type === "interface"
          ? true
          : props.history.compiled.type === "success",
    },
  };
  return {
    ...partial,
    protocol: operation.protocol as "class",
    operation: operation as AgenticaOperation.Class<Model>,
    toJSON: () => ({
      ...partial,
      protocol: operation.protocol as "class",
      operation: operation.toJSON(),
    }),
  };
}
