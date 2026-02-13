import {
  AutoBeEventSource,
  AutoBePreliminaryKind,
  AutoBeProgressEventBase,
  AutoBeRealizeCorrectEvent,
  AutoBeRealizeFunction,
  AutoBeRealizeValidateEvent,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { ILlmController } from "@samchon/openapi";
import { IPointer } from "tstl";
import { v7 } from "uuid";

import { AutoBeConfigConstant } from "../../../constants/AutoBeConfigConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { executeCachedBatch } from "../../../utils/executeCachedBatch";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";
import { compileRealizeFiles } from "../programmers/compileRealizeFiles";
import { IAutoBeRealizeFunctionFailure } from "../structures/IAutoBeRealizeFunctionFailure";

interface IProgrammer<
  RealizeFunction extends AutoBeRealizeFunction,
  PreliminaryKind extends AutoBePreliminaryKind,
  Complete,
> {
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
    source: Exclude<AutoBeEventSource, "facade" | "preliminary">;
    build(next: Complete): void;
  }): ILlmController;
  preliminary(props: {
    function: RealizeFunction;
    source: Exclude<AutoBeEventSource, "facade" | "preliminary">;
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
): Promise<RealizeFunction[]> => {
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
): Promise<RealizeFunction[]> => {
  if (props.event.result.type === "failure") {
    ctx.dispatch(props.event);
    return await correct(ctx, props, life);
  }
  return props.functions;
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
): Promise<RealizeFunction[]> => {
  // Early returns for non-correctable cases
  if (props.event.result.type !== "failure" || life < 0) {
    return props.functions;
  }

  const failure: IAutoBeTypeScriptCompileResult.IFailure = props.event.result;
  const errorLocations: string[] = getErrorFiles({
    location: props.programmer.location,
    failure,
  }).filter((l) => props.functions.map((f) => f.location).includes(l));

  // If no locations to correct, return original functions
  if (errorLocations.length === 0) {
    return props.functions;
  }

  const converted: ICorrectionResult<RealizeFunction>[] =
    await executeCachedBatch(
      ctx,
      errorLocations.map(
        (location) => async (): Promise<ICorrectionResult<RealizeFunction>> => {
          const localFunction: RealizeFunction = props.functions.find(
            (f) => f.location === location,
          )!;
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
                diagnostics: failure.diagnostics.filter(
                  (d) => d.file === localFunction.location,
                ),
              },
            ];
          try {
            return await process(ctx, {
              programmer: props.programmer,
              progress: props.progress,
              preliminary: props.preliminaries.get(location)!,
              function: localFunction,
              failures: localFailures,
            });
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

  // Get functions that were not modified (not in locations array)
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
    return allFunctionsForValidation;
  } else if (newResult.type === "exception") {
    // Compilation exception, return current functions. because retrying won't help.
    return props.functions;
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
    return [...success, ...ignored, ...unchangedFunctions];
  }

  // Recursively retry failed functions
  const retriedFunctions: RealizeFunction[] = await predicate(
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
  return [...success, ...ignored, ...retriedFunctions, ...unchangedFunctions];
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
  return await props.preliminary.orchestrate(ctx, async (out) => {
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

    const content: string = await props.programmer.replaceImportStatements({
      function: props.function,
      code: pointer.value.revise.final ?? pointer.value.draft,
    });
    ctx.dispatch({
      id: v7(),
      type: "realizeCorrect",
      kind: "overall",
      function: {
        ...props.function,
        content,
      },
      created_at: new Date().toISOString(),
      step: ctx.state().analyze?.step ?? 0,
      metric: result.metric,
      tokenUsage: result.tokenUsage,
    } satisfies AutoBeRealizeCorrectEvent);
    return out(result)({
      type: "success" as const,
      function: {
        ...props.function,
        content,
      },
    });
  });
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
          props.progress.completed -
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

  const functionLocations: string[] = props.functions.map((f) => f.location);

  compiled.result.diagnostics = compiled.result.diagnostics.filter(
    (d) => d.file !== null && functionLocations.includes(d.file),
  );
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
