import {
  AutoBeExampleProject,
  AutoBeHistory,
  AutoBePhase,
  IAutoBePlaygroundBenchmark,
  IAutoBePlaygroundBenchmarkScore,
  IAutoBePlaygroundReplay,
} from "@autobe/interface";
import { AutoBeProcessAggregateFactory } from "@autobe/utils";
import typia from "typia";

export namespace AutoBeReplayComputer {
  export const SIGNIFICANT_PROJECTS: AutoBeExampleProject[] = [
    "todo",
    "reddit",
    "shopping",
    "erp",
  ];

  export const compare = (
    a: IAutoBePlaygroundBenchmark,
    b: IAutoBePlaygroundBenchmark,
  ): number => {
    const x: number = a.score.aggregate;
    const y: number = b.score.aggregate;
    if (y !== x) return y - x;
    return compareVendors(a.vendor, b.vendor);
  };

  export const compareVendors = (a: string, b: string): number => {
    const pa: string[] = a.split("-");
    const pb: string[] = b.split("-");
    const len: number = Math.max(pa.length, pb.length);
    for (let i: number = 0; i < len; i++) {
      const ra: string = pa[i] ?? "";
      const rb: string = pb[i] ?? "";
      const na: number | null = parsePart(ra);
      const nb: number | null = parsePart(rb);
      if (na !== null && nb !== null) {
        if (na !== nb) return nb - na;
      } else {
        const cmp: number = ra.localeCompare(rb);
        if (cmp !== 0) return cmp;
      }
    }
    return 0;
  };

  export const score = (
    summaries: IAutoBePlaygroundReplay.ISummary[],
  ): IAutoBePlaygroundBenchmarkScore => {
    // list up significant projects
    summaries = summaries.filter((s) =>
      ["todo", "reddit", "shopping", "erp"].includes(s.project),
    );

    const individual = (project: AutoBeExampleProject): number => {
      const found: IAutoBePlaygroundReplay.ISummary | undefined =
        summaries.find((s) => s.project === project);
      if (found === undefined) return 0;
      return compute(found);
    };
    return {
      aggregate: round(
        summaries
          .map(compute)
          .filter((x) => x !== null)
          .reduce((a, b) => a + b, 0) / 4,
      ),
      todo: individual("todo"),
      reddit: individual("reddit"),
      shopping: individual("shopping"),
      erp: individual("erp"),
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
      database: predicate(
        "database",
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
          functions: h.functions.length,
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
      (["realize", "test", "interface", "database", "analyze"] as const).find(
        (key) => phaseStates[key] !== null,
      ) ?? null;
    return {
      vendor: replay.vendor,
      project: replay.project,
      ...phaseStates,
      aggregates: AutoBeProcessAggregateFactory.reduce(
        Object.values(phaseStates)
          .filter((p) => p !== null)
          .map((p) => p.aggregates),
      ),
      phase,
      elapsed: Object.values(phaseStates)
        .map((p) => p?.elapsed ?? 0)
        .reduce((a, b) => a + (b ?? 0), 0),
    };
  };

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
}

const parsePart = (s: string): number | null => {
  let t: string;
  if (s.startsWith("a") && s.endsWith("b")) t = s.slice(1, -1);
  else if (s.endsWith("b")) t = s.slice(0, -1);
  else t = s;
  if (t === "") return null;
  const n: number = Number(t);
  return isNaN(n) ? null : n;
};

const compute = (summary: IAutoBePlaygroundReplay.ISummary): number => {
  const getScore = (phase: AutoBePhase): number => {
    const state: IAutoBePlaygroundReplay.IPhaseState | null = summary[phase];
    if (!state) return 0;

    const [success, failure]: [
      number,
      (commodity: Record<string, number>) => number,
    ] = FORMULA[phase];
    return state.success === true
      ? success
      : success * failure(state.commodity);
  };
  return round(
    sum(
      typia.misc
        .literals<AutoBePhase>()
        .map(getScore)
        .filter((x) => x !== null && Number.isFinite(x)),
    ),
  );
};
const round = (value: number): number => Math.round(value * 100) / 100;
const sum = (targets: number[]): number => targets.reduce((a, b) => a + b, 0);

// for type safety
const FORMULA: Record<
  AutoBePhase,
  [number, (commodity: Record<string, number>) => number]
> = {
  analyze: [10, () => 0],
  database: [20, () => 0.5],
  interface: [30, () => 0.5],
  test: [20, (c) => Math.max(0.5, 1 - (c.errors * 3) / c.functions)],
  realize: [20, (c) => Math.max(0.5, 1 - (c.errors * 3) / c.functions)],
};
