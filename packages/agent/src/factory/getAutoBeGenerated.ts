import {
  AutoBeAnalyzeHistory,
  AutoBeHistory,
  AutoBeInterfaceHistory,
  AutoBePrismaHistory,
  AutoBeProcessAggregateCollection,
  AutoBeRealizeHistory,
  AutoBeTestHistory,
  IAutoBeCompiler,
  IAutoBeGetFilesOptions,
} from "@autobe/interface";
import { AutoBeProcessAggregateFactory } from "@autobe/utils";

import { AutoBeState } from "../context/AutoBeState";
import { AutoBeTokenUsage } from "../context/AutoBeTokenUsage";
import { getAutoBeRealizeGenerated } from "./getAutoBeRealizeGenerated";

export async function getAutoBeGenerated(props: {
  compiler: IAutoBeCompiler;
  state: AutoBeState;
  histories: Readonly<AutoBeHistory[]>;
  tokenUsage: AutoBeTokenUsage;
  options?: Partial<IAutoBeGetFilesOptions>;
}): Promise<Record<string, string>> {
  const options: Required<IAutoBeGetFilesOptions> = {
    phase:
      (props.options?.phase ?? props.state.realize)
        ? "realize"
        : props.state.test
          ? "test"
          : props.state.interface
            ? "interface"
            : "analyze",
    dbms: props.options?.dbms ?? "postgres",
  };
  const ret: Record<string, string> = await props.compiler.getTemplate(options);
  ret["README.md"] = writeReadMe(props.state, ret["README.md"]);
  if (props.state.analyze === null) return ret;

  // ANALYZE
  Object.assign<Record<string, string>, Record<string, string>>(
    ret,
    Object.fromEntries(
      props.state.analyze.files.map((file) => [
        `docs/analysis/${file.filename.split("/").at(-1)}`,
        file.content,
      ]),
    ),
  );
  if (props.options?.phase === "analyze") return ret;

  // PRISMA
  if (props.state.prisma?.step === props.state.analyze.step) {
    const schemaFiles: Record<string, string> =
      (options?.dbms ?? "postgres") === "postgres"
        ? props.state.prisma.schemas
        : await props.compiler.prisma.write(
            props.state.prisma.result.data,
            options!.dbms!,
          );
    Object.assign<
      Record<string, string>,
      Record<string, string>,
      Record<string, string>
    >(
      ret,
      Object.fromEntries(
        Object.entries(schemaFiles).map(([key, value]) => [
          `prisma/schema/${key.split("/").at(-1)}`,
          value,
        ]),
      ),
      {
        "autobe/prisma.json": JSON.stringify(props.state.prisma.result.data),
      },
    );
    if (props.state.prisma.compiled.type === "success")
      ret["docs/ERD.md"] = props.state.prisma.compiled.document;
    else if (props.state.prisma.compiled.type === "failure")
      ret["prisma/compile-error-reason.log"] =
        props.state.prisma.compiled.reason;
  }
  if (props.options?.phase === "prisma") return ret;

  // INTERFACE
  if (props.state.interface?.step === props.state.analyze.step) {
    const files: Record<string, string> = await props.compiler.interface.write(
      props.state.interface.document,
      Object.keys(ret),
    );
    Object.assign<
      Record<string, string>,
      Record<string, string>,
      Record<string, string>
    >(
      ret,
      props.state.test?.step === props.state.interface.step
        ? Object.fromEntries(
            Object.entries(files).filter(
              ([key]) => key.startsWith("test/features/") === false,
            ),
          )
        : files,
      {
        "autobe/document.json": JSON.stringify(props.state.interface.document),
      },
    );
  }
  if (props.options?.phase === "interface") return ret;

  // TEST
  if (props.state.test?.step === props.state.analyze.step)
    Object.assign<Record<string, string>, Record<string, string>>(
      ret,
      Object.fromEntries(
        props.state.test.files.map((f) => [f.location, f.content]),
      ),
    );

  // REALIZE
  if (props.state.realize?.step === props.state.analyze.step)
    Object.assign<Record<string, string>, Record<string, string>>(
      ret,
      await getAutoBeRealizeGenerated({
        compiler: props.compiler,
        document: props.state.interface!.document,
        authorizations: props.state.realize.authorizations,
        functions: props.state.realize.functions,
        options: {
          dbms: options?.dbms ?? "postgres",
        },
      }),
    );
  if (props.options?.phase === "test") return ret;

  // LOGGING
  Object.assign<Record<string, string>, Record<string, string>>(ret, {
    "autobe/histories.json": JSON.stringify(props.histories),
    "autobe/tokenUsage.json": JSON.stringify(props.tokenUsage),
  });
  return ret;
}

function writeReadMe(state: AutoBeState, readme: string): string {
  const emoji = (
    history:
      | AutoBeAnalyzeHistory
      | AutoBePrismaHistory
      | AutoBeInterfaceHistory
      | AutoBeTestHistory
      | AutoBeRealizeHistory
      | null,
  ): string => (history ? (success(history) ? "✅" : "❌") : "");
  return readme
    .replaceAll("{{ANALYSIS_EMOJI}}", emoji(state.analyze))
    .replaceAll("{{PRISMA_EMOJI}}", emoji(state.prisma))
    .replaceAll("{{INTERFACE_EMOJI}}", emoji(state.interface))
    .replaceAll("{{TEST_EMOJI}}", emoji(state.test))
    .replaceAll("{{REALIZE_EMOJI}}", emoji(state.realize))
    .replaceAll("{{BENCHMARK_AGGREGATE}}", writeBenchmarkAggregate(state))
    .replaceAll(
      "{{BENCHMARK_FUNCTION_CALLING}}",
      writeBenchmarkFunctionCalling(state),
    );
}

function writeBenchmarkAggregate(state: AutoBeState): string {
  return [
    state.analyze,
    state.prisma,
    state.interface,
    state.test,
    state.realize,
  ]
    .filter((h) => h !== null)
    .map((h) =>
      [
        `${success(h) ? "✅" : "❌"} ${h.type}`,
        Object.entries(label(h))
          .map(([k, v]) => `${k}: ${v.toLocaleString()}`)
          .join(", "),
        (
          (h.aggregates.total.metric.success /
            h.aggregates.total.metric.attempt) *
          100
        ).toFixed(2) + " %",
        h.aggregates.total.tokenUsage.total.toLocaleString(),
        Math.round(
          (new Date(h.completed_at).getTime() -
            new Date(h.created_at).getTime()) /
            1_000,
        ) + " sec",
      ].join(" | "),
    )
    .join("\n");
}

function writeBenchmarkFunctionCalling(state: AutoBeState): string {
  const aggregates: AutoBeProcessAggregateCollection =
    AutoBeProcessAggregateFactory.reduce(
      [state.analyze, state.prisma, state.interface, state.test, state.realize]
        .filter((h) => h !== null)
        .map((h) => h.aggregates),
    );
  return Object.entries(aggregates)
    .map(([key, value]) =>
      [
        key,
        value.metric.attempt.toLocaleString(),
        value.metric.validationFailure.toLocaleString(),
        value.metric.invalidJson.toLocaleString(),
        value.metric.success.toLocaleString(),
        ((value.metric.success / value.metric.attempt) * 100).toFixed(2) + " %",
      ].join(" | "),
    )
    .join("\n");
}

function success(
  history:
    | AutoBeAnalyzeHistory
    | AutoBePrismaHistory
    | AutoBeInterfaceHistory
    | AutoBeTestHistory
    | AutoBeRealizeHistory,
): boolean {
  if (history.type === "analyze") return true;
  else if (history.type === "interface") return history.missed.length === 0;
  else if (
    history.type === "prisma" ||
    history.type === "test" ||
    history.type === "realize"
  )
    return history.compiled.type === "success";
  history satisfies never;
  throw new Error("Unknown history type encountered.");
}

function label(
  history:
    | AutoBeAnalyzeHistory
    | AutoBePrismaHistory
    | AutoBeInterfaceHistory
    | AutoBeTestHistory
    | AutoBeRealizeHistory,
): Record<string, number> {
  if (history.type === "analyze")
    return {
      actors: history.actors.length,
      documents: history.files.length,
    };
  else if (history.type === "prisma")
    return {
      namespaces: history.result.data.files.length,
      models: history.result.data.files.map((f) => f.models).flat().length,
    };
  else if (history.type === "interface")
    return {
      operations: history.document.operations.length,
      schemas: Object.keys(history.document.components.schemas).length,
    };
  else if (history.type === "test") {
    return {
      functions: history.files.length,
      ...(history.compiled.type === "failure"
        ? {
            errors: new Set(
              history.compiled.diagnostics.map((d) => d.file ?? ""),
            ).size,
          }
        : {}),
    };
  } else if (history.type === "realize")
    return {
      functions: history.functions.length,
      ...(history.compiled.type === "failure"
        ? {
            errors: new Set(
              history.compiled.diagnostics.map((d) => d.file ?? ""),
            ).size,
          }
        : {}),
    };
  history satisfies never;
  throw new Error("Unknown history type encountered.");
}
