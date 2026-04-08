import {
  AutoBeEventSource,
  AutoBePreliminaryKind,
  AutoBeProgressEventBase,
  AutoBeRealizeCorrectEvent,
  AutoBeRealizeFunction,
  AutoBeRealizeValidateEvent,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { IPointer } from "tstl";
import { ILlmController } from "typia";
import { v7 } from "uuid";

import { AutoBeConfigConstant } from "../../../constants/AutoBeConfigConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { executeCachedBatch } from "../../../utils/executeCachedBatch";
import { forceRetry } from "../../../utils/forceRetry";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";
import { compileRealizeFiles } from "../programmers/compileRealizeFiles";
import { IAutoBeRealizeFunctionFailure } from "../structures/IAutoBeRealizeFunctionFailure";
import { IAutoBeRealizeFunctionResult } from "../structures/IAutoBeRealizeFunctionResult";

/**
 * Deduplicate diagnostics by grouping identical messages and capping total
 * count.
 *
 * Single root causes (e.g., `null` in select) can produce 50-300 cascading
 * errors with identical messages. This function collapses them so the LLM
 * focuses on the root cause instead of being overwhelmed by repetition.
 */
const deduplicateDiagnostics = (
  diagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[],
): IAutoBeTypeScriptCompileResult.IDiagnostic[] => {
  const byMessage = new Map<
    string,
    {
      diag: IAutoBeTypeScriptCompileResult.IDiagnostic;
      count: number;
    }
  >();
  for (const d of diagnostics) {
    const key = d.messageText;
    const existing = byMessage.get(key);
    if (existing) {
      existing.count++;
    } else {
      byMessage.set(key, { diag: d, count: 1 });
    }
  }

  const deduped: IAutoBeTypeScriptCompileResult.IDiagnostic[] = [];
  for (const [, { diag, count }] of byMessage) {
    deduped.push({
      ...diag,
      messageText:
        count > 1
          ? `${diag.messageText} (repeated ${count} times - fix the root cause)`
          : diag.messageText,
    });
  }

  if (deduped.length > 25) {
    const truncated = deduped.slice(0, 25);
    truncated.push({
      file: deduped[0]!.file,
      start: null,
      length: null,
      code: 0,
      messageText: `[+${deduped.length - 25} additional unique errors omitted - focus on the above errors first]`,
      category: "error",
    });
    return truncated;
  }
  return deduped;
};

/**
 * Sanitize LLM-generated code by removing common artifacts:
 *
 * - Chain-of-thought text leaked into code output
 * - Token truncation artifacts (e.g., standalone 'n' characters)
 * - Markdown code fences
 */
const sanitizeGeneratedCode = (code: string): string => {
  let result = code;

  // 1. Extract code from markdown fences if present
  const codeBlockMatch = result.match(
    /```(?:typescript|ts)?\s*\n([\s\S]*?)\n```/,
  );
  if (codeBlockMatch) {
    result = codeBlockMatch[1]!;
  }

  // 2. Remove everything before the first export statement
  const exportMatch = result.match(
    /(export\s+(?:namespace|async\s+function|function|const)\s+[\s\S]*)/,
  );
  if (exportMatch) {
    result = exportMatch[1]!;
  }

  // 3. Remove standalone 'n' token artifacts (minimax-m2.7 pattern)
  // Only remove lines that are EXACTLY 'n' (with optional whitespace)
  result = result.replace(/^\s*n\s*$/gm, "");

  // 4. Remove trailing 'n' after commas (another truncation pattern)
  result = result.replace(/,\s*n\s*\n/g, ",\n");

  return result.trim();
};

interface IProgrammer<
  RealizeFunction extends AutoBeRealizeFunction,
  PreliminaryKind extends AutoBePreliminaryKind,
  Complete,
> {
  template(func: RealizeFunction): string;
  replaceImportStatements(props: {
    function: RealizeFunction;
    code: string;
  }): Promise<string>;
  additional(functions: RealizeFunction[]): Record<string, string>;
  histories(props: {
    function: RealizeFunction;
    failures: IAutoBeRealizeFunctionFailure<RealizeFunction>[];
    preliminary: AutoBePreliminaryController<PreliminaryKind>;
  }): Promise<IAutoBeOrchestrateHistory>;
  controller(next: {
    function: RealizeFunction;
    preliminary: AutoBePreliminaryController<PreliminaryKind>;
    source: Exclude<AutoBeEventSource, "facade" | "preliminaryAcquire">;
    build(next: Complete): void;
  }): ILlmController;
  preliminary(props: {
    function: RealizeFunction;
    source: Exclude<AutoBeEventSource, "facade" | "preliminaryAcquire">;
  }): AutoBePreliminaryController<PreliminaryKind>;
  location: string;
}

interface IComplete {
  draft: string;
  revise: {
    review: string;
    final: string | null;
  };
}

interface ICorrectionResult<RealizeFunction extends AutoBeRealizeFunction> {
  type: "success" | "ignore" | "exception";
  function: RealizeFunction;
}

export const orchestrateRealizeCorrectOverall = async <
  RealizeFunction extends AutoBeRealizeFunction,
  PreliminaryKind extends AutoBePreliminaryKind,
  Complete extends IComplete,
>(
  ctx: AutoBeContext,
  props: {
    programmer: IProgrammer<RealizeFunction, PreliminaryKind, Complete>;
    functions: RealizeFunction[];
    progress: AutoBeProgressEventBase;
  },
  life: number = AutoBeConfigConstant.COMPILER_RETRY,
): Promise<IAutoBeRealizeFunctionResult<RealizeFunction>[]> => {
  const preliminaries: Map<
    string,
    AutoBePreliminaryController<PreliminaryKind>
  > = new Map(
    props.functions.map((func) => [
      func.location,
      props.programmer.preliminary({
        function: func,
        source: SOURCE,
      }),
    ]),
  );
  const validateEvent: AutoBeRealizeValidateEvent = await compileWithFiltering(
    ctx,
    {
      functions: props.functions,
      programmer: props.programmer,
      progress: props.progress,
    },
  );
  return predicate(
    ctx,
    {
      programmer: props.programmer,
      functions: props.functions,
      preliminaries,
      previousFailures: [],
      progress: props.progress,
      event: validateEvent,
    },
    life,
  );
};

const predicate = async <
  RealizeFunction extends AutoBeRealizeFunction,
  PreliminaryKind extends AutoBePreliminaryKind,
  Complete extends IComplete,
>(
  ctx: AutoBeContext,
  props: {
    programmer: IProgrammer<RealizeFunction, PreliminaryKind, Complete>;
    functions: RealizeFunction[];
    preliminaries: Map<string, AutoBePreliminaryController<PreliminaryKind>>;
    previousFailures: IAutoBeRealizeFunctionFailure<RealizeFunction>[][];
    progress: AutoBeProgressEventBase;
    event: AutoBeRealizeValidateEvent;
  },
  life: number,
): Promise<IAutoBeRealizeFunctionResult<RealizeFunction>[]> => {
  if (props.event.result.type === "failure") {
    ctx.dispatch(props.event);
    return await correct(ctx, props, life);
  }
  return props.functions.map((f) => ({ success: true, function: f }));
};

const correct = async <
  RealizeFunction extends AutoBeRealizeFunction,
  PreliminaryKind extends AutoBePreliminaryKind,
  Complete extends IComplete,
>(
  ctx: AutoBeContext,
  props: {
    programmer: IProgrammer<RealizeFunction, PreliminaryKind, Complete>;
    preliminaries: Map<string, AutoBePreliminaryController<PreliminaryKind>>;
    functions: RealizeFunction[];
    previousFailures: IAutoBeRealizeFunctionFailure<RealizeFunction>[][];
    progress: AutoBeProgressEventBase;
    event: AutoBeRealizeValidateEvent;
  },
  life: number,
): Promise<IAutoBeRealizeFunctionResult<RealizeFunction>[]> => {
  // Early returns for non-correctable cases
  if (props.event.result.type !== "failure")
    return props.functions.map((f) => ({ success: true, function: f }));
  else if (life < 0)
    return props.functions.map((f) => ({ success: false, function: f }));

  const failure: IAutoBeTypeScriptCompileResult.IFailure = props.event.result;
  const allErrorLocations: string[] = getErrorFiles({
    location: props.programmer.location,
    failure,
  }).filter((l) => props.functions.map((f) => f.location).includes(l));

  // If no locations to correct, return original functions
  if (allErrorLocations.length === 0) {
    return props.functions.map((f) => ({ success: false, function: f }));
  }

  const errorLocations: string[] = allErrorLocations;

  const converted: ICorrectionResult<RealizeFunction>[] =
    await executeCachedBatch(
      ctx,
      errorLocations.map(
        (location) => async (): Promise<ICorrectionResult<RealizeFunction>> => {
          const localFunction: RealizeFunction = props.functions.find(
            (f) => f.location === location,
          )!;
          const rawDiagnostics = failure.diagnostics.filter(
            (d) => d.file === localFunction.location,
          );

          // P2-5: Log when error count is very high (suggests regeneration may be better than correction)
          if (rawDiagnostics.length > 20) {
            console.warn(
              `[realizeCorrectOverall] ${rawDiagnostics.length} errors in ${localFunction.location} — consider regeneration instead of correction`,
            );
          }

          const localFailures: IAutoBeRealizeFunctionFailure<RealizeFunction>[] =
            [
              ...props.previousFailures
                .map(
                  (pf) =>
                    pf.find(
                      (f) => f.function.location === localFunction.location,
                    ) ?? null,
                )
                .filter((x) => x !== null),
              {
                function: localFunction,
                diagnostics: deduplicateDiagnostics(rawDiagnostics),
              },
            ];
          try {
            return await forceRetry(() =>
              process(ctx, {
                programmer: props.programmer,
                progress: props.progress,
                preliminary: props.preliminaries.get(location)!,
                function: localFunction,
                failures: localFailures,
              }),
            );
          } catch (error) {
            console.log("realizeCorrectOverall", localFunction.location, error);
            return {
              type: "exception",
              function: localFunction,
            };
          }
        },
      ),
    );

  // Get functions that were not modified (not in corrected locations).
  // Deferred files (cross-file dependency victims) are included here
  // automatically — they will be retried in the next iteration after
  // root-cause corrections have been applied and recompiled.
  const unchangedFunctions: RealizeFunction[] = props.functions.filter(
    (f) => !errorLocations.includes(f.location),
  );

  // Merge converted functions with unchanged functions for validation
  const allFunctionsForValidation: RealizeFunction[] = [
    ...converted.map((c) => c.function),
    ...unchangedFunctions,
  ];
  const newValidate: AutoBeRealizeValidateEvent = await compileWithFiltering(
    ctx,
    {
      functions: allFunctionsForValidation,
      programmer: props.programmer,
      progress: props.progress,
    },
  );
  const newResult: IAutoBeTypeScriptCompileResult = newValidate.result;
  if (newResult.type === "success") {
    return allFunctionsForValidation.map((f) => ({
      success: true,
      function: f,
    }));
  } else if (newResult.type === "exception") {
    // Compilation exception, return current functions. because retrying won't help.
    return props.functions.map((f) => ({ success: false, function: f }));
  }

  const newLocations: string[] =
    newValidate.result.type === "failure"
      ? getErrorFiles({
          failure: newValidate.result,
          location: props.programmer.location,
        })
      : [];

  // Separate successful, failed, and ignored corrections
  const { success, failed, ignored } = separateCorrectionResults(
    converted,
    newLocations,
  );

  // If no failures to retry, return all functions
  if (failed.length === 0) {
    return [
      ...success.map((f) => ({ success: true, function: f })),
      ...ignored.map((f) => ({ success: false, function: f })),
      ...unchangedFunctions.map((f) => ({ success: true, function: f })),
    ];
  }

  // Recursively retry failed functions
  const retriedResults: IAutoBeRealizeFunctionResult<RealizeFunction>[] =
    await predicate(
      ctx,
      {
        programmer: props.programmer,
        preliminaries: props.preliminaries,
        functions: failed,
        previousFailures: [
          ...props.previousFailures,
          failed.map(
            (f) =>
              ({
                function: f,
                diagnostics:
                  newValidate.result.type === "failure"
                    ? newValidate.result.diagnostics.filter(
                        (d) => d.file === f.location,
                      )
                    : [],
              }) satisfies IAutoBeRealizeFunctionFailure<RealizeFunction>,
          ),
        ],
        progress: props.progress,
        event: newValidate,
      },
      life - 1,
    );
  return [
    ...success.map((f) => ({ success: true, function: f })),
    ...ignored.map((f) => ({ success: false, function: f })),
    ...retriedResults,
    ...unchangedFunctions.map((f) => ({ success: true, function: f })),
  ];
};

const process = async <
  RealizeFunction extends AutoBeRealizeFunction,
  PreliminaryKind extends AutoBePreliminaryKind,
  Complete extends IComplete,
>(
  ctx: AutoBeContext,
  props: {
    programmer: IProgrammer<RealizeFunction, PreliminaryKind, Complete>;
    function: RealizeFunction;
    preliminary: AutoBePreliminaryController<PreliminaryKind>;
    failures: IAutoBeRealizeFunctionFailure<RealizeFunction>[];
    progress: AutoBeProgressEventBase;
  },
): Promise<ICorrectionResult<RealizeFunction>> => {
  const event: AutoBeRealizeCorrectEvent = await props.preliminary.orchestrate(
    ctx,
    async (out) => {
      const pointer: IPointer<Complete | null> = {
        value: null,
      };
      const controller: ILlmController = props.programmer.controller({
        preliminary: props.preliminary,
        build(next: Complete) {
          pointer.value = next;
        },
        function: props.function,
        source: SOURCE,
      });
      const result: AutoBeContext.IResult = await ctx.conversate({
        source: SOURCE,
        controller,
        enforceFunctionCall: true,
        ...(await props.programmer.histories({
          preliminary: props.preliminary,
          function: props.function,
          failures: props.failures,
        })),
      });
      if (pointer.value === null) return out(result)(null);

      const template: string = props.programmer.template(props.function);
      const content: string = await props.programmer.replaceImportStatements({
        function: props.function,
        code: sanitizeGeneratedCode(
          pointer.value.revise.final ?? pointer.value.draft,
        ),
      });
      const corrected: RealizeFunction = {
        ...props.function,
        content,
        template,
      };
      return out(result)({
        id: v7(),
        type: "realizeCorrect",
        kind: "overall",
        function: corrected,
        created_at: new Date().toISOString(),
        step: ctx.state().analyze?.step ?? 0,
        metric: result.metric,
        tokenUsage: result.tokenUsage,
      } satisfies AutoBeRealizeCorrectEvent);
    },
  );
  ctx.dispatch(event);
  return {
    type: "success" as const,
    function: event.function as RealizeFunction,
  };
};

const compileWithFiltering = async <
  RealizeFunction extends AutoBeRealizeFunction,
  PreliminaryKind extends AutoBePreliminaryKind,
  Complete extends IComplete,
>(
  ctx: AutoBeContext,
  props: {
    functions: RealizeFunction[];
    programmer: IProgrammer<RealizeFunction, PreliminaryKind, Complete>;
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeValidateEvent> => {
  const compiled: AutoBeRealizeValidateEvent = await compileRealizeFiles(ctx, {
    functions: props.functions,
    additional: props.programmer.additional(props.functions),
    progress: (result) => {
      if (result.type === "success")
        props.progress.completed = props.functions.length;
      else if (result.type === "failure")
        props.progress.completed =
          props.progress.total -
          new Set(
            result.diagnostics
              .map((d) => d.file)
              .filter((f) => f !== null)
              .filter((x) => !!props.functions.find((y) => y.location === x)),
          ).size;
      return props.progress;
    },
  });
  if (compiled.result.type !== "failure") return compiled;

  const functionLocations = new Set(props.functions.map((f) => f.location));

  const directErrors = compiled.result.diagnostics.filter(
    (d) => d.file !== null && functionLocations.has(d.file),
  );
  const crossFileErrors = compiled.result.diagnostics.filter(
    (d) => d.file !== null && !functionLocations.has(d.file),
  );

  // Log cross-file errors for debugging (P1-4)
  if (crossFileErrors.length > 0) {
    console.warn(
      `[realizeCorrectOverall] ${crossFileErrors.length} cross-file errors detected in: ` +
        [...new Set(crossFileErrors.map((d) => d.file))].join(", "),
    );
  }

  compiled.result.diagnostics = directErrors;
  if (compiled.result.diagnostics.length === 0) {
    compiled.result = { type: "success" };
  }
  return compiled;
};

/**
 * Extract unique file locations from validation event diagnostics
 *
 * @param event - Validation event containing compilation results
 * @returns Array of unique file paths that have errors
 */
const getErrorFiles = (props: {
  failure: IAutoBeTypeScriptCompileResult.IFailure;
  location: string;
}): string[] => {
  const diagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[] =
    props.failure.diagnostics;
  const locations: string[] = diagnostics
    .map((d) => d.file)
    .filter((f): f is string => f !== null)
    .filter((f) => f.startsWith(props.location));
  return Array.from(new Set(locations));
};

/**
 * Separate correction results into successful, failed, and ignored functions
 *
 * @param corrections - Array of correction results
 * @param errorLocations - File paths that still have errors
 * @returns Object with success, failed, and ignored function arrays
 */
const separateCorrectionResults = <
  RealizeFunction extends AutoBeRealizeFunction,
>(
  corrections: ICorrectionResult<RealizeFunction>[],
  errorLocations: string[],
): {
  success: RealizeFunction[];
  failed: RealizeFunction[];
  ignored: RealizeFunction[];
} => {
  const success: RealizeFunction[] = corrections
    .filter(
      (c) =>
        c.type === "success" && !errorLocations.includes(c.function.location),
    )
    .map((c) => c.function);
  const failed: RealizeFunction[] = corrections
    .filter(
      (c) =>
        c.type === "success" && errorLocations.includes(c.function.location),
    )
    .map((c) => c.function);
  const ignored: RealizeFunction[] = corrections
    .filter((c) => c.type === "ignore" || c.type === "exception")
    .map((c) => c.function);
  return { success, failed, ignored };
};

const SOURCE = "realizeCorrect" satisfies AutoBeEventSource;
