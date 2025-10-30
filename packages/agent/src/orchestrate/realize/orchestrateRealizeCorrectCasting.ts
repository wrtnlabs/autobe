import {
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeRealizeAuthorization,
  AutoBeRealizeFunction,
  AutoBeRealizeValidateEvent,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import {
  ILlmApplication,
  ILlmController,
  ILlmSchema,
  IValidation,
} from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { validateEmptyCode } from "../../utils/validateEmptyCode";
import { IAutoBeCommonCorrectCastingApplication } from "../common/structures/IAutoBeCommonCorrectCastingApplication";
import { transformRealizeCorrectCastingHistories } from "./histories/transformRealizeCorrectCastingHistories";
import { compileRealizeFiles } from "./internal/compileRealizeFiles";
import { IAutoBeRealizeFunctionFailure } from "./structures/IAutoBeRealizeFunctionFailure";
import { IAutoBeRealizeScenarioResult } from "./structures/IAutoBeRealizeScenarioResult";
import { getRealizeWriteCodeTemplate } from "./utils/getRealizeWriteCodeTemplate";
import { replaceImportStatements } from "./utils/replaceImportStatements";

/** Result of attempting to correct a single function */
type CorrectionResult = {
  result: "success" | "ignore" | "exception";
  func: AutoBeRealizeFunction;
};

export const orchestrateRealizeCorrectCasting = async <
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  scenarios: IAutoBeRealizeScenarioResult[],
  authorizations: AutoBeRealizeAuthorization[],
  functions: AutoBeRealizeFunction[],
  progress: AutoBeProgressEventBase,
  life: number = ctx.retry,
): Promise<AutoBeRealizeFunction[]> => {
  const validateEvent: AutoBeRealizeValidateEvent = await compileRealizeFiles(
    ctx,
    {
      authorizations,
      functions,
    },
  );
  return predicate(
    ctx,
    {
      scenarios,
      authorizations,
      functions,
      previousFailures: [],
      progress,
      event: validateEvent,
    },
    life,
  );
};

const predicate = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    scenarios: IAutoBeRealizeScenarioResult[];
    authorizations: AutoBeRealizeAuthorization[];
    functions: AutoBeRealizeFunction[];
    previousFailures: IAutoBeRealizeFunctionFailure[][];
    progress: AutoBeProgressEventBase;
    event: AutoBeRealizeValidateEvent;
  },
  life: number,
): Promise<AutoBeRealizeFunction[]> => {
  if (props.event.result.type === "failure") {
    ctx.dispatch(props.event);
    return await correct(ctx, props, life);
  }
  return props.functions;
};

const correct = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    scenarios: IAutoBeRealizeScenarioResult[];
    authorizations: AutoBeRealizeAuthorization[];
    functions: AutoBeRealizeFunction[];
    previousFailures: IAutoBeRealizeFunctionFailure[][];
    progress: AutoBeProgressEventBase;
    event: AutoBeRealizeValidateEvent;
  },
  life: number,
): Promise<AutoBeRealizeFunction[]> => {
  // Early returns for non-correctable cases
  if (props.event.result.type !== "failure" || life < 0) {
    return props.functions;
  }

  const failure = props.event.result;
  const locations: string[] = diagnose(props.event).filter((l) =>
    props.functions.map((f) => f.location).includes(l),
  );

  // If no locations to correct, return original functions
  if (locations.length === 0) {
    return props.functions;
  }

  props.progress.total += locations.length;

  const converted: CorrectionResult[] = await executeCachedBatch(
    locations.map((location) => async (): Promise<CorrectionResult> => {
      const func: AutoBeRealizeFunction = props.functions.find(
        (f) => f.location === location,
      )!;
      const scenario: IAutoBeRealizeScenarioResult = props.scenarios.find(
        (s) => s.location === func.location,
      )!;
      const operation: AutoBeOpenApi.IOperation = scenario.operation;
      const authorization: AutoBeRealizeAuthorization | undefined =
        props.authorizations.find(
          (a) => a.actor.name === operation.authorizationActor,
        );

      const pointer: IPointer<
        IAutoBeCommonCorrectCastingApplication.IProps | false | null
      > = {
        value: null,
      };
      const { metric, tokenUsage } = await ctx.conversate({
        source: "realizeCorrect",
        histories: transformRealizeCorrectCastingHistories({
          failures: [
            ...props.previousFailures
              .map(
                (pf) =>
                  pf.find((f) => f.function.location === func.location) ?? null,
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
        controller: createController({
          model: ctx.model,
          functionName: scenario.functionName,
          then: (next) => {
            pointer.value = next;
          },
          reject: () => {
            pointer.value = false;
          },
        }),
        enforceFunctionCall: true,
        message: StringUtil.trim`
          Fix the TypeScript casting problems to resolve the compilation error.

          Most casting errors are caused by type mismatches between Date types and
          string & tags.Format<'date-time'>. To fix these:
          - Use ONLY the pre-provided toISOStringSafe() function to convert Date to string
          - Do NOT use .toISOString() method directly (use toISOStringSafe instead)
          - Never use Date type directly in declarations or return values

          You don't need to explain me anything, but just fix or give it up
          immediately without any hesitation, explanation, and questions.

          The instruction to write at first was as follows, and the code you received is the code you wrote according to this instruction.
          When modifying, modify the entire code, but not the import statement.

          Below is template code you wrote:

          ${getRealizeWriteCodeTemplate({
            scenario,
            schemas: ctx.state().interface!.document.components.schemas,
            operation: scenario.operation,
            authorization: authorization ?? null,
          })}

          Current code is as follows:

          \`\`\`typescript
          ${func.content}
          \`\`\`

          Also, never use typia.assert and typia.assertGuard like functions
          to the Prisma types. Your mission is to fix the casting problem of
          primitive types like string or number. Prisma type is not your scope.

          If you take a mistake that casting the Prisma type with the typia.assert
          function, it would be fallen into the infinite compilation due to extremely
          complicated Prisma type. Note that, the typia.assert function is allowed
          only in the individual property level string or literal type.

          I repeat that, never assert the Prisma type. It's not your mission.
        `,
      });
      ++props.progress.completed;

      if (pointer.value === null)
        return { result: "exception" as const, func: func };
      else if (pointer.value === false)
        return { result: "ignore" as const, func: func };

      pointer.value.draft = await replaceImportStatements(ctx, {
        schemas: ctx.state().interface!.document.components.schemas,
        operation: operation,
        code: pointer.value.draft,
        decoratorType: authorization?.payload.name,
      });
      if (pointer.value.revise.final)
        pointer.value.revise.final = await replaceImportStatements(ctx, {
          schemas: ctx.state().interface!.document.components.schemas,
          operation: operation,
          code: pointer.value.revise.final,
          decoratorType: authorization?.payload.name,
        });

      ctx.dispatch({
        id: v7(),
        type: "realizeCorrect",
        kind: "casting",
        content: pointer.value.revise.final ?? pointer.value.draft,
        created_at: new Date().toISOString(),
        location: func.location,
        step: ctx.state().analyze?.step ?? 0,
        metric,
        tokenUsage,
        completed: props.progress.completed,
        total: props.progress.total,
      });
      return {
        result: "success" as const,
        func: {
          ...func,
          content: pointer.value.revise.final ?? pointer.value.draft,
        },
      };
    }),
  );

  // Get functions that were not modified (not in locations array)
  const unchangedFunctions: AutoBeRealizeFunction[] = props.functions.filter(
    (f) => !locations.includes(f.location),
  );

  // Merge converted functions with unchanged functions for validation
  const allFunctionsForValidation = [
    ...converted.map((c) => c.func),
    ...unchangedFunctions,
  ];

  const newValidate: AutoBeRealizeValidateEvent = await compileRealizeFiles(
    ctx,
    {
      authorizations: props.authorizations,
      functions: allFunctionsForValidation,
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

  const newLocations: string[] = diagnose(newValidate);

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
  const retriedFunctions: AutoBeRealizeFunction[] = await predicate(
    ctx,
    {
      scenarios: props.scenarios,
      authorizations: props.authorizations,
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
            }) satisfies IAutoBeRealizeFunctionFailure,
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
const diagnose = (event: AutoBeRealizeValidateEvent): string[] => {
  if (event.result.type !== "failure") {
    return [];
  }

  const diagnostics = event.result.diagnostics;
  const locations = diagnostics
    .map((d) => d.file)
    .filter((f): f is string => f !== null)
    .filter((f) => f.startsWith("src/providers"));

  return Array.from(new Set(locations));
};

/**
 * Separate correction results into successful, failed, and ignored functions
 *
 * @param corrections - Array of correction results
 * @param errorLocations - File paths that still have errors
 * @returns Object with success, failed, and ignored function arrays
 */
const separateCorrectionResults = (
  corrections: CorrectionResult[],
  errorLocations: string[],
): {
  success: AutoBeRealizeFunction[];
  failed: AutoBeRealizeFunction[];
  ignored: AutoBeRealizeFunction[];
} => {
  const success = corrections
    .filter(
      (c) =>
        c.result === "success" && !errorLocations.includes(c.func.location),
    )
    .map((c) => c.func);

  const failed = corrections
    .filter(
      (c) => c.result === "success" && errorLocations.includes(c.func.location),
    )
    .map((c) => c.func);

  const ignored = corrections
    .filter((c) => c.result === "ignore" || c.result === "exception")
    .map((c) => c.func);

  return { success, failed, ignored };
};

const createController = <Model extends ILlmSchema.Model>(props: {
  model: Model;
  functionName: string;
  then: (next: IAutoBeCommonCorrectCastingApplication.IProps) => void;
  reject: () => void;
}): ILlmController<Model> => {
  assertSchemaModel(props.model);
  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeCommonCorrectCastingApplication.IProps> =
      typia.validate<IAutoBeCommonCorrectCastingApplication.IProps>(input);
    if (result.success === false) return result;
    const errors: IValidation.IError[] = validateEmptyCode({
      functionName: props.functionName,
      draft: result.data.draft,
      revise: result.data.revise,
    });
    return errors.length
      ? {
          success: false,
          errors,
          data: result.data,
        }
      : result;
  };
  const application = collection[
    props.model === "chatgpt" ? "chatgpt" : "claude"
  ](validate) satisfies ILlmApplication<any> as any as ILlmApplication<Model>;
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

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBeCommonCorrectCastingApplication, "chatgpt">({
      validate: {
        rewrite: validate,
        reject: () => ({
          success: true,
          data: undefined,
        }),
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBeCommonCorrectCastingApplication, "claude">({
      validate: {
        rewrite: validate,
        reject: () => ({
          success: true,
          data: undefined,
        }),
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeCommonCorrectCastingApplication.IProps>;
