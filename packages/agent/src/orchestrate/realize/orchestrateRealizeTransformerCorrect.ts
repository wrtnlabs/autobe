import {
  AutoBeEventSource,
  AutoBeProgressEventBase,
  AutoBeRealizeCorrectEvent,
  AutoBeRealizeTransformerFunction,
} from "@autobe/interface";
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
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformRealizeTransformerCorrectHistory } from "./histories/transformRealizeTransformerCorrectHistory";
import { compileRealizeFiles } from "./internal/compileRealizeFiles";
import { AutoBeRealizeTransformerProgrammer } from "./programmers/AutoBeRealizeTransformerProgrammer";
import { IAutoBeRealizeFunctionFailure } from "./structures/IAutoBeRealizeFunctionFailure";
import { IAutoBeRealizeTransformerCorrectApplication } from "./structures/IAutoBeRealizeTransformerCorrectApplication";
import { filterDiagnostics } from "./utils/filterDiagnostics";

export async function orchestrateRealizeTransformerCorrect<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  props: {
    functions: AutoBeRealizeTransformerFunction[];
    previousFailures: IAutoBeRealizeFunctionFailure<AutoBeRealizeTransformerFunction>[][];
    progress: AutoBeProgressEventBase;
  },
  life: number = ctx.retry,
): Promise<AutoBeRealizeTransformerFunction[]> {
  const event = await compileRealizeFiles(ctx, {
    functions: props.functions,
    additional: {},
  });
  if (event.result.type !== "failure") return props.functions;
  else if (life < 0) return props.functions;

  // Extract and process diagnostics
  const diagnostics = event.result.diagnostics;

  if (
    event.result.diagnostics.every(
      (d) => !d.file?.startsWith("src/transformers"),
    ) === true
  ) {
    // No diagnostics related to transformer functions, stop correcting
    return props.functions;
  }

  const locations: string[] = Array.from(
    new Set(
      diagnostics
        .map((d) => d.file)
        .filter((f): f is string => f !== null)
        .filter((f) => f.startsWith("src/transformers")),
    ),
  );

  props.progress.total += locations.length;

  // Group diagnostics by file and add to failures
  const diagnosticsByFile: Record<
    string,
    IAutoBeRealizeFunctionFailure<AutoBeRealizeTransformerFunction>
  > = {};
  diagnostics.forEach((diagnostic) => {
    const location: string | null = diagnostic.file;
    if (location === null) return;
    if (!location.startsWith("src/transformers")) return;

    if (!diagnosticsByFile[location]) {
      const func: AutoBeRealizeTransformerFunction | undefined =
        props.functions.find((f) => f.location === location);
      if (func === undefined) {
        return;
      }

      const failure: IAutoBeRealizeFunctionFailure<AutoBeRealizeTransformerFunction> =
        {
          function: func,
          diagnostics: [],
        };
      diagnosticsByFile[location] = failure;
    }
    diagnosticsByFile[location].diagnostics.push(diagnostic);
  });

  const newFailures: IAutoBeRealizeFunctionFailure<AutoBeRealizeTransformerFunction>[] =
    Object.values(diagnosticsByFile);
  const corrected: AutoBeRealizeTransformerFunction[] = await correct(ctx, {
    locations,
    functions: props.functions,
    previousFailures: props.previousFailures,
    failures: filterDiagnostics(
      newFailures,
      props.functions.map((fn) => fn.location),
    ),
    progress: props.progress,
  });
  return orchestrateRealizeTransformerCorrect(
    ctx,
    {
      functions: corrected,
      previousFailures: [...props.previousFailures, newFailures],
      progress: props.progress,
    },
    life - 1,
  );
}

async function correct<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    locations: string[];
    functions: AutoBeRealizeTransformerFunction[];
    previousFailures: IAutoBeRealizeFunctionFailure<AutoBeRealizeTransformerFunction>[][];
    failures: IAutoBeRealizeFunctionFailure<AutoBeRealizeTransformerFunction>[];
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeTransformerFunction[]> {
  if (props.locations.length === 0) {
    return props.functions;
  }

  const corrected: AutoBeRealizeTransformerFunction[] =
    await executeCachedBatch(
      ctx,
      props.locations.map(
        (location) =>
          async (): Promise<AutoBeRealizeTransformerFunction> => {
            const func = props.functions.find((el) => el.location === location);

            if (!func) {
              throw new Error("No function found for location: " + location);
            }

            const failures: IAutoBeRealizeFunctionFailure<AutoBeRealizeTransformerFunction>[] =
              props.failures.filter((f) => f.function?.location === location);
            if (failures.length) {
              try {
                const correctEvent: AutoBeRealizeCorrectEvent | null =
                  await step(ctx, {
                    function: func,
                    previousFailures: props.previousFailures
                      .map((pf) => {
                        const previousFailures: IAutoBeRealizeFunctionFailure<AutoBeRealizeTransformerFunction>[] =
                          pf.filter((f) => f.function.location === location);
                        if (previousFailures.length === 0) return null;
                        return {
                          function: previousFailures[0].function,
                          diagnostics: previousFailures
                            .map((f) => f.diagnostics)
                            .flat(),
                        };
                      })
                      .filter((f) => f !== null),
                    failure: {
                      function: failures[0].function,
                      diagnostics: failures.map((f) => f.diagnostics).flat(),
                    },
                    progress: props.progress,
                  });

                return {
                  ...func,
                  content: correctEvent === null ? "" : correctEvent.content,
                };
              } catch (err) {
                return func;
              }
            }

            return func;
          },
      ),
    );

  // Create a map of corrected functions for efficient lookup
  const correctedMap = new Map(corrected.map((f) => [f.location, f]));

  // Return all functions, with corrected ones replaced
  return props.functions.map((func) => correctedMap.get(func.location) || func);
}

async function step<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    function: AutoBeRealizeTransformerFunction;
    previousFailures: IAutoBeRealizeFunctionFailure<AutoBeRealizeTransformerFunction>[];
    failure: IAutoBeRealizeFunctionFailure<AutoBeRealizeTransformerFunction>;
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeCorrectEvent | null> {
  const preliminary: AutoBePreliminaryController<"prismaSchemas"> =
    new AutoBePreliminaryController({
      source: SOURCE,
      application:
        typia.json.application<IAutoBeRealizeTransformerCorrectApplication>(),
      kinds: ["prismaSchemas"],
      state: ctx.state(),
    });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeRealizeTransformerCorrectApplication.IComplete | null> =
      {
        value: null,
      };
    const result: AutoBeContext.IResult<Model> = await ctx.conversate({
      source: "realizeCorrect",
      controller: createController({
        model: ctx.model,
        functionName: AutoBeRealizeTransformerProgrammer.getName(
          props.function.plan.dtoTypeName,
        ),
        build: (next) => {
          pointer.value = next;
        },
        preliminary,
      }),
      enforceFunctionCall: true,
      ...transformRealizeTransformerCorrectHistory({
        plan: props.function.plan,
        function: props.function,
        document: ctx.state().interface!.document,
        failures: [...props.previousFailures, props.failure],
        preliminary,
      }),
    });
    if (pointer.value !== null) {
      const event: AutoBeRealizeCorrectEvent = {
        type: "realizeCorrect",
        kind: "overall",
        id: v7(),
        location: props.function.location,
        content:
          await AutoBeRealizeTransformerProgrammer.replaceImportStatements(
            ctx,
            {
              dtoTypeName: props.function.plan.dtoTypeName,
              schemas: ctx.state().interface!.document.components.schemas,
              code: pointer.value.revise.final ?? pointer.value.draft,
            },
          ),
        metric: result.metric,
        tokenUsage: result.tokenUsage,
        completed: ++props.progress.completed,
        total: props.progress.total,
        step: ctx.state().analyze?.step ?? 0,
        created_at: new Date().toISOString(),
      };
      ctx.dispatch(event);
      return out(result)(event);
    }
    return out(result)(null);
  });
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  functionName: string;
  build: (next: IAutoBeRealizeTransformerCorrectApplication.IComplete) => void;
  preliminary: AutoBePreliminaryController<"prismaSchemas">;
}): ILlmController<Model> {
  assertSchemaModel(props.model);

  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeRealizeTransformerCorrectApplication.IProps> =
      typia.validate<IAutoBeRealizeTransformerCorrectApplication.IProps>(input);
    if (result.success === false) return result;
    else if (result.data.request.type !== "complete")
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request: result.data.request,
      });

    const errors: IValidation.IError[] = validateEmptyCode({
      functionName: props.functionName,
      draft: result.data.request.draft,
      revise: result.data.request.revise,
    });
    return errors.length
      ? {
          success: false,
          errors,
          data: result.data,
        }
      : result;
  };
  const application: ILlmApplication<Model> = collection[
    props.model === "chatgpt"
      ? "chatgpt"
      : props.model === "gemini"
        ? "gemini"
        : "claude"
  ](
    validate,
  ) satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>;

  return {
    protocol: "class",
    name: SOURCE,
    application,
    execute: {
      process: (next) => {
        if (next.request.type === "complete") props.build(next.request);
      },
    } satisfies IAutoBeRealizeTransformerCorrectApplication,
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<
      IAutoBeRealizeTransformerCorrectApplication,
      "chatgpt"
    >({
      validate: {
        process: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<
      IAutoBeRealizeTransformerCorrectApplication,
      "claude"
    >({
      validate: {
        process: validate,
      },
      },
    ),
  gemini: (validate: Validator) =>
    typia.llm.application<
      IAutoBeRealizeTransformerCorrectApplication,
      "gemini"
    >({
      validate: {
        process: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeRealizeTransformerCorrectApplication.IProps>;

const SOURCE = "realizeCorrect" satisfies AutoBeEventSource;
