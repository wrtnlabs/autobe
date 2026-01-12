import {
  AutoBeProgressEventBase,
  AutoBeRealizeFunction,
  AutoBeRealizeValidateEvent,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { ILlmApplication, ILlmController, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeConfigConstant } from "../../../constants/AutoBeConfigConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";
import { executeCachedBatch } from "../../../utils/executeCachedBatch";
import { IAutoBeCommonCorrectCastingApplication } from "../../common/structures/IAutoBeCommonCorrectCastingApplication";
import { transformRealizeCorrectCastingHistory } from "../histories/transformRealizeCorrectCastingHistory";
import { compileRealizeFiles } from "../programmers/compileRealizeFiles";
import { IAutoBeRealizeFunctionFailure } from "../structures/IAutoBeRealizeFunctionFailure";

/** Result of attempting to correct a single function */
interface ICorrectionResult<RealizeFunction extends AutoBeRealizeFunction> {
  type: "success" | "ignore" | "exception";
  function: RealizeFunction;
}
interface IProgrammer<RealizeFunction extends AutoBeRealizeFunction> {
  template(func: RealizeFunction): string;
  replaceImportStatements(props: {
    function: RealizeFunction;
    code: string;
  }): Promise<string>;
  additional(functions: RealizeFunction[]): Record<string, string>;
  location: string;
}

export const orchestrateRealizeCorrectCasting = async <
  RealizeFunction extends AutoBeRealizeFunction,
>(
  ctx: AutoBeContext,
  props: {
    programmer: IProgrammer<RealizeFunction>;
    functions: RealizeFunction[];
    progress: AutoBeProgressEventBase;
  },
  life: number = AutoBeConfigConstant.COMPILER_RETRY,
): Promise<RealizeFunction[]> => {
  const validateEvent: AutoBeRealizeValidateEvent = await compileRealizeFiles(
    ctx,
    {
      functions: props.functions,
      additional: props.programmer.additional(props.functions),
    },
  );
  return predicate(
    ctx,
    {
      programmer: props.programmer,
      functions: props.functions,
      previousFailures: [],
      progress: props.progress,
      event: validateEvent,
    },
    life,
  );
};

const predicate = async <RealizeFunction extends AutoBeRealizeFunction>(
  ctx: AutoBeContext,
  props: {
    programmer: IProgrammer<RealizeFunction>;
    functions: RealizeFunction[];
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

const correct = async <RealizeFunction extends AutoBeRealizeFunction>(
  ctx: AutoBeContext,
  props: {
    programmer: IProgrammer<RealizeFunction>;
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

  props.progress.total += errorLocations.length;

  const converted: ICorrectionResult<RealizeFunction>[] =
    await executeCachedBatch(
      ctx,
      errorLocations.map(
        (location) => async (): Promise<ICorrectionResult<RealizeFunction>> => {
          const func: RealizeFunction = props.functions.find(
            (f) => f.location === location,
          )!;
          const template: string = props.programmer.template(func);

          const pointer: IPointer<
            IAutoBeCommonCorrectCastingApplication.IProps | false | null
          > = {
            value: null,
          };
          const { metric, tokenUsage } = await ctx.conversate({
            source: "realizeCorrect",
            controller: createController({
              then: (next) => {
                pointer.value = next;
              },
              reject: () => {
                pointer.value = false;
              },
            }),
            enforceFunctionCall: true,
            ...transformRealizeCorrectCastingHistory({
              template,
              function: func,
              failures: [
                ...props.previousFailures
                  .map(
                    (pf) =>
                      pf.find((f) => f.function.location === func.location) ??
                      null,
                  )
                  .filter((x) => x !== null),
                {
                  function: func,
                  diagnostics: failure.diagnostics.filter(
                    (d) => d.file === func.location,
                  ),
                },
              ],
            }),
          });
          ++props.progress.completed;

          if (pointer.value === null)
            return { type: "exception" as const, function: func };
          else if (pointer.value === false)
            return { type: "ignore" as const, function: func };

          const content: string =
            await props.programmer.replaceImportStatements({
              function: func,
              code: pointer.value.revise.final ?? pointer.value.draft,
            });
          ctx.dispatch({
            id: v7(),
            type: "realizeCorrect",
            kind: "casting",
            function: {
              ...func,
              content,
            },
            created_at: new Date().toISOString(),
            step: ctx.state().analyze?.step ?? 0,
            metric,
            tokenUsage,
            completed: props.progress.completed,
            total: props.progress.total,
          });
          return {
            type: "success" as const,
            function: {
              ...func,
              content,
            },
          };
        },
      ),
    );

  // Get functions that were not modified (not in locations array)
  const unchangedFunctions: RealizeFunction[] = props.functions.filter(
    (f) => !errorLocations.includes(f.location),
  );

  // Merge converted functions with unchanged functions for validation
  const allFunctionsForValidation = [
    ...converted.map((c) => c.function),
    ...unchangedFunctions,
  ];

  const newValidate: AutoBeRealizeValidateEvent = await compileRealizeFiles(
    ctx,
    {
      functions: allFunctionsForValidation,
      additional: props.programmer.additional(allFunctionsForValidation),
    },
  );

  const newResult: IAutoBeTypeScriptCompileResult = newValidate.result;
  if (newResult.type === "success") {
    return allFunctionsForValidation;
  } else if (newResult.type === "exception") {
    // Compilation exception, return current functions. because retrying won't help.
    return props.functions;
  }

  if (
    newResult.diagnostics.every((d) => !d.file?.startsWith("src/providers"))
  ) {
    // No diagnostics related to provider functions, stop correcting
    return allFunctionsForValidation;
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

const createController = (props: {
  then: (next: IAutoBeCommonCorrectCastingApplication.IProps) => void;
  reject: () => void;
}): ILlmController => {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeCommonCorrectCastingApplication.IProps> => {
    const result: IValidation<IAutoBeCommonCorrectCastingApplication.IProps> =
      typia.validate<IAutoBeCommonCorrectCastingApplication.IProps>(input);
    if (result.success === false) return result;
    // @todo: validate empty code?
    return result;
  };
  const application: ILlmApplication =
    typia.llm.application<IAutoBeCommonCorrectCastingApplication>({
      validate: {
        rewrite: validate,
        reject: () => ({
          success: true,
          data: undefined,
        }),
      },
    });
  return {
    protocol: "class",
    name: "correctInvalidRequest",
    application,
    execute: {
      rewrite: (next) => {
        props.then(next);
      },
      reject: () => {
        props.reject();
      },
    } satisfies IAutoBeCommonCorrectCastingApplication,
  };
};
