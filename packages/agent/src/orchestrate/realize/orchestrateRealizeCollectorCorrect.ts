import {
  AutoBeEventSource,
  AutoBeProgressEventBase,
  AutoBeRealizeCollectorFunction,
  AutoBeRealizeCorrectEvent,
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
import { transformRealizeCollectorCorrectHistory } from "./histories/transformRealizeCollectorCorrectHistory";
import { compileRealizeFiles } from "./internal/compileRealizeFiles";
import { AutoBeRealizeCollectorProgrammer } from "./programmers/AutoBeRealizeCollectorProgrammer";
import { IAutoBeRealizeCollectorCorrectApplication } from "./structures/IAutoBeRealizeCollectorCorrectApplication";
import { IAutoBeRealizeFunctionFailure } from "./structures/IAutoBeRealizeFunctionFailure";
import { filterDiagnostics } from "./utils/filterDiagnostics";

export async function orchestrateRealizeCollectorCorrect<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  props: {
    functions: AutoBeRealizeCollectorFunction[];
    previousFailures: IAutoBeRealizeFunctionFailure<AutoBeRealizeCollectorFunction>[][];
    progress: AutoBeProgressEventBase;
  },
  life: number = ctx.retry,
): Promise<AutoBeRealizeCollectorFunction[]> {
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
      (d) => !d.file?.startsWith("src/collectors"),
    ) === true
  ) {
    // No diagnostics related to collector functions, stop correcting
    return props.functions;
  }

  const locations: string[] = Array.from(
    new Set(
      diagnostics
        .map((d) => d.file)
        .filter((f): f is string => f !== null)
        .filter((f) => f.startsWith("src/collectors")),
    ),
  );

  props.progress.total += locations.length;

  // Group diagnostics by file and add to failures
  const diagnosticsByFile: Record<
    string,
    IAutoBeRealizeFunctionFailure<AutoBeRealizeCollectorFunction>
  > = {};
  diagnostics.forEach((diagnostic) => {
    const location: string | null = diagnostic.file;
    if (location === null) return;
    if (!location.startsWith("src/collectors")) return;

    if (!diagnosticsByFile[location]) {
      const func: AutoBeRealizeCollectorFunction | undefined =
        props.functions.find((f) => f.location === location);
      if (func === undefined) {
        return;
      }

      const failure: IAutoBeRealizeFunctionFailure<AutoBeRealizeCollectorFunction> =
        {
          function: func,
          diagnostics: [],
        };
      diagnosticsByFile[location] = failure;
    }
    diagnosticsByFile[location].diagnostics.push(diagnostic);
  });

  const newFailures: IAutoBeRealizeFunctionFailure<AutoBeRealizeCollectorFunction>[] =
    Object.values(diagnosticsByFile);
  const corrected: AutoBeRealizeCollectorFunction[] = await correct(ctx, {
    locations,
    functions: props.functions,
    previousFailures: props.previousFailures,
    failures: filterDiagnostics(
      newFailures,
      props.functions.map((fn) => fn.location),
    ),
    progress: props.progress,
  });
  return orchestrateRealizeCollectorCorrect(
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
    functions: AutoBeRealizeCollectorFunction[];
    previousFailures: IAutoBeRealizeFunctionFailure<AutoBeRealizeCollectorFunction>[][];
    failures: IAutoBeRealizeFunctionFailure<AutoBeRealizeCollectorFunction>[];
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeCollectorFunction[]> {
  if (props.locations.length === 0) {
    return props.functions;
  }

  const corrected: AutoBeRealizeCollectorFunction[] = await executeCachedBatch(
    ctx,
    props.locations.map(
      (location) =>
        async (): Promise<AutoBeRealizeCollectorFunction> => {
          const func = props.functions.find((el) => el.location === location);

          if (!func) {
            throw new Error("No function found for location: " + location);
          }

          const failures: IAutoBeRealizeFunctionFailure<AutoBeRealizeCollectorFunction>[] =
            props.failures.filter((f) => f.function?.location === location);
          if (failures.length) {
            try {
              const correctEvent: AutoBeRealizeCorrectEvent | null = await step(
                ctx,
                {
                  function: func,
                  previousFailures: props.previousFailures
                    .map((pf) => {
                      const previousFailures: IAutoBeRealizeFunctionFailure<AutoBeRealizeCollectorFunction>[] =
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
                },
              );

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
    function: AutoBeRealizeCollectorFunction;
    previousFailures: IAutoBeRealizeFunctionFailure<AutoBeRealizeCollectorFunction>[];
    failure: IAutoBeRealizeFunctionFailure<AutoBeRealizeCollectorFunction>;
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeCorrectEvent | null> {
  const preliminary: AutoBePreliminaryController<"prismaSchemas"> =
    new AutoBePreliminaryController({
      source: SOURCE,
      application:
        typia.json.application<IAutoBeRealizeCollectorCorrectApplication>(),
      kinds: ["prismaSchemas"],
      state: ctx.state(),
    });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeRealizeCollectorCorrectApplication.IComplete | null> =
      {
        value: null,
      };
    const result: AutoBeContext.IResult<Model> = await ctx.conversate({
      source: "realizeCorrect",
      controller: createController({
        model: ctx.model,
        functionName: AutoBeRealizeCollectorProgrammer.getName(
          props.function.plan.dtoTypeName,
        ),
        build: (next) => {
          pointer.value = next;
        },
        preliminary,
      }),
      enforceFunctionCall: true,
      ...transformRealizeCollectorCorrectHistory({
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
        content: await AutoBeRealizeCollectorProgrammer.replaceImportStatements(
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
  build: (next: IAutoBeRealizeCollectorCorrectApplication.IComplete) => void;
  preliminary: AutoBePreliminaryController<"prismaSchemas">;
}): ILlmController<Model> {
  assertSchemaModel(props.model);

  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeRealizeCollectorCorrectApplication.IProps> =
      typia.validate<IAutoBeRealizeCollectorCorrectApplication.IProps>(input);
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
    } satisfies IAutoBeRealizeCollectorCorrectApplication,
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<
      IAutoBeRealizeCollectorCorrectApplication,
      "chatgpt"
    >({
      validate: {
        process: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBeRealizeCollectorCorrectApplication, "claude">(
      {
        validate: {
          process: validate,
        },
      },
    ),
  gemini: (validate: Validator) =>
    typia.llm.application<IAutoBeRealizeCollectorCorrectApplication, "gemini">(
      {
        validate: {
          process: validate,
        },
      },
    ),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeRealizeCollectorCorrectApplication.IProps>;

const SOURCE = "realizeCorrect" satisfies AutoBeEventSource;
