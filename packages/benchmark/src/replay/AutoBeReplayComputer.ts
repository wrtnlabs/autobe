import {
  AutoBeExampleProject,
  AutoBeHistory,
  AutoBePhase,
  IAutoBePlaygroundBenchmarkScore,
  IAutoBePlaygroundReplay,
} from "@autobe/interface";
import { AutoBeProcessAggregateFactory } from "@autobe/utils";

export namespace AutoBeReplayComputer {
  export const SIGNIFICANT_PROJECTS: AutoBeExampleProject[] = [
    "todo",
    "bbs",
    "reddit",
    "shopping",
  ];

  export const emoji = (
    summaries: IAutoBePlaygroundReplay.ISummary[],
  ): string => {
    const success: number = summaries.filter(
      (s) => s.realize !== null && s.realize.success === true,
    ).length;
    if (success >= 3) return "🟢";

    const tested: boolean = !!summaries.find((s) => s.test !== null);
    return tested ? "🟡" : "❌";
  };

  export const score = (
    summaries: IAutoBePlaygroundReplay.ISummary[],
  ): IAutoBePlaygroundBenchmarkScore => {
    // list up significant projects
    summaries = summaries.filter((s) =>
      ["todo", "bbs", "reddit", "shopping"].includes(s.project),
    );

    // the formula to compute the benchmark score
    const compute = (summary: IAutoBePlaygroundReplay.ISummary): number => {
      const add = (
        phase: IAutoBePlaygroundReplay.IPhaseState | null,
        success: number,
        failure?: number,
      ): number =>
        phase !== null
          ? phase.success === true
            ? success
            : (failure ?? success / 2)
          : 0;
      return (
        add(summary.analyze, 10) +
        add(summary.prisma, 20) +
        add(summary.interface, 30) +
        add(summary.test, 20) +
        add(summary.realize, 20)
      );
    };
    const individual = (project: AutoBeExampleProject): number => {
      const found = summaries.find((s) => s.project === project);
      if (found === undefined) return 0;
      return compute(found);
    };
    return {
      aggregate: summaries.map(compute).reduce((a, b) => a + b, 0) / 4,
      todo: individual("todo"),
      bbs: individual("bbs"),
      reddit: individual("reddit"),
      shopping: individual("shopping"),
    };
  };

  export const summarize = (
    replay: IAutoBePlaygroundReplay,
  ): IAutoBePlaygroundReplay.ISummary => {
    const predicate = <Type extends AutoBePhase>(
      type: Type,
      success: (history: AutoBeHistory.Mapper[Type]) => boolean,
      commodity: (
        history: AutoBeHistory.Mapper[Type],
      ) => Record<string, number>,
    ): IAutoBePlaygroundReplay.IPhaseState | null => {
      const reversed: AutoBeHistory[] = replay.histories.slice().reverse();
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
        commodity: commodity(history),
        elapsed:
          new Date(history.completed_at).getTime() -
          new Date(history.created_at).getTime(),
        aggregates: history.aggregates,
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
          actors: h.actors.length,
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
        (h) => h.missed.length === 0,
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
      vendor: replay.vendor,
      project: replay.project,
      aggregates: AutoBeProcessAggregateFactory.reduce(
        replay.histories
          .filter(
            (h) =>
              h.type === "analyze" ||
              h.type === "prisma" ||
              h.type === "interface" ||
              h.type === "test" ||
              h.type === "realize",
          )
          .map((h) => h.aggregates),
      ),
      elapsed: replay.histories
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
