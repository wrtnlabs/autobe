import {
  AutoBeHistory,
  AutoBePhase,
  IAutoBePlaygroundReplay,
  IAutoBeTokenUsageJson,
} from "@autobe/interface";

export namespace AutoBePlaygroundReplayUtil {
  export const summarize = (props: {
    vendor: string;
    project: string;
    histories: AutoBeHistory[];
    tokenUsage: IAutoBeTokenUsageJson;
  }): IAutoBePlaygroundReplay.ISummary | null => {
    const predicate = <Type extends AutoBePhase>(
      type: Type,
      success: (history: AutoBeHistory.Mapper[Type]) => boolean,
      aggregate: (
        history: AutoBeHistory.Mapper[Type],
      ) => Record<string, number>,
    ): IAutoBePlaygroundReplay.IPhaseState | null => {
      const reversed: AutoBeHistory[] = props.histories.slice().reverse();
      const step: number | undefined = reversed.find(
        (h) => h.type === "analyze",
      )?.step;
      if (step === undefined) return null;

      const history: AutoBeHistory.Mapper[Type] | undefined = reversed.find(
        (h) => h.type === type && h.step === step,
      ) as AutoBeHistory.Mapper[Type] | undefined;
      if (history === undefined) return null;
      return {
        success: success(history),
        aggregate: aggregate(history),
        elapsed:
          new Date(history.completed_at).getTime() -
          new Date(history.created_at).getTime(),
      };
    };
    const phaseStates: Record<
      AutoBePhase,
      IAutoBePlaygroundReplay.IPhaseState | null
    > = {
      analyze: predicate(
        "analyze",
        () => true,
        (h) => ({
          actors: h.roles.length,
          documents: h.files.length,
        }),
      ),
      prisma: predicate(
        "prisma",
        (h) => h.compiled.type === "success",
        (h) => ({
          namespaces: h.result.data.files.length,
          models: h.result.data.files.map((f) => f.models).flat().length,
        }),
      ),
      interface: predicate(
        "interface",
        () => true,
        (h) => ({
          operations: h.document.operations.length,
          schemas: Object.keys(h.document.components.schemas).length,
        }),
      ),
      test: predicate(
        "test",
        (h) => h.compiled.type === "success",
        (h) => ({
          functions: h.files.length,
          ...(h.compiled.type === "failure"
            ? {
                errors: new Set(h.compiled.diagnostics.map((d) => d.file ?? ""))
                  .size,
              }
            : {}),
        }),
      ),
      realize: predicate(
        "realize",
        (h) => h.compiled.type === "success",
        (h) => ({
          functions: h.functions.length,
          ...(h.compiled.type === "failure"
            ? {
                errors: new Set(h.compiled.diagnostics.map((d) => d.file ?? ""))
                  .size,
              }
            : {}),
        }),
      ),
    };
    const phase: AutoBePhase | null =
      (["realize", "test", "interface", "prisma", "analyze"] as const).find(
        (key) => phaseStates[key] !== null,
      ) ?? null;
    return {
      vendor: props.vendor,
      project: props.project,
      tokenUsage: props.tokenUsage,
      elapsed: props.histories
        .filter(
          (h) => h.type !== "userMessage" && h.type !== "assistantMessage",
        )
        .map(
          (h) =>
            new Date(h.completed_at).getTime() -
            new Date(h.created_at).getTime(),
        )
        .reduce((a, b) => a + b, 0),
      ...phaseStates,
      phase,
    };
  };
}
