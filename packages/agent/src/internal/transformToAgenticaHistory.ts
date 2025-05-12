import { AgenticaOperation, MicroAgenticaHistory } from "@agentica/core";
import { AutoBeHistory } from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

export function transformToAgenticaHistory<
  Model extends ILlmSchema.Model,
>(props: {
  operations: readonly AgenticaOperation<Model>[];
  history: AutoBeHistory;
}): MicroAgenticaHistory<Model> | null {
  if (props.history.type === "user" || props.history.type === "reply")
    return props.history as any as MicroAgenticaHistory<Model>;

  const operation: AgenticaOperation<Model> | undefined = props.operations.find(
    (op) => op.function.name === props.history.type,
  );
  if (operation === undefined) return null;
  const partial = {
    id: props.history.id,
    type: "execute" as const,
    arguments: {
      reason: props.history.reason,
    },
    value: {
      success:
        props.history.type === "analyze" || props.history.type === "interface"
          ? true
          : props.history.result.type === "success",
      description: props.history.description,
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
