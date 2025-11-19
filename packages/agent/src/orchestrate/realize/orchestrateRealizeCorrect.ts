import {
  AutoBeEventSource,
  AutoBeProgressEventBase,
  AutoBeRealizeAuthorization,
  AutoBeRealizeCorrectEvent,
  AutoBeRealizeFunction,
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
import { transformRealizeCorrectHistory } from "./histories/transformRealizeCorrectHistory";
import { compileRealizeFiles } from "./internal/compileRealizeFiles";
import { IAutoBeRealizeCorrectApplication } from "./structures/IAutoBeRealizeCorrectApplication";
import { IAutoBeRealizeFunctionFailure } from "./structures/IAutoBeRealizeFunctionFailure";
import { IAutoBeRealizeScenarioResult } from "./structures/IAutoBeRealizeScenarioResult";
import { filterDiagnostics } from "./utils/filterDiagnostics";
import { getRealizeWriteDto } from "./utils/getRealizeWriteDto";
import { replaceImportStatements } from "./utils/replaceImportStatements";

export async function orchestrateRealizeCorrect<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  scenarios: IAutoBeRealizeScenarioResult[],
  authorizations: AutoBeRealizeAuthorization[],
  functions: AutoBeRealizeFunction[],
  previousFailures: IAutoBeRealizeFunctionFailure[][],
  progress: AutoBeProgressEventBase,
  life: number = ctx.retry,
): Promise<AutoBeRealizeFunction[]> {
  const event = await compileRealizeFiles(ctx, {
    authorizations,
    functions,
  });
  if (event.result.type !== "failure") return functions;
  else if (life < 0) return functions;

  // Extract and process diagnostics
  const diagnostics = event.result.diagnostics;

  if (
    event.result.diagnostics.every(
      (d) => !d.file?.startsWith("src/providers"),
    ) === true
  ) {
    // No diagnostics related to provider functions, stop correcting
    return functions;
  }

  const locations: string[] = Array.from(
    new Set(
      diagnostics
        .map((d) => d.file)
        .filter((f): f is string => f !== null)
        .filter((f) => f.startsWith("src/providers")),
    ),
  );

  progress.total += locations.length;

  // Group diagnostics by file and add to failures
  const diagnosticsByFile: Record<string, IAutoBeRealizeFunctionFailure> = {};
  diagnostics.forEach((diagnostic) => {
    const location: string | null = diagnostic.file;
    if (location === null) return;
    if (!location.startsWith("src/providers")) return;

    if (!diagnosticsByFile[location]) {
      const func: AutoBeRealizeFunction | undefined = functions.find(
        (f) => f.location === location,
      );
      if (func === undefined) {
        return;
      }

      const failure: IAutoBeRealizeFunctionFailure = {
        function: func,
        diagnostics: [],
      };
      diagnosticsByFile[location] = failure;
    }
    diagnosticsByFile[location].diagnostics.push(diagnostic);
  });

  const newFailures: IAutoBeRealizeFunctionFailure[] =
    Object.values(diagnosticsByFile);
  const corrected: AutoBeRealizeFunction[] = await correct(ctx, {
    locations,
    scenarios,
    authorizations,
    functions,
    previousFailures,
    failures: filterDiagnostics(
      newFailures,
      functions.map((fn) => fn.location),
    ),
    progress,
  });
  return orchestrateRealizeCorrect(
    ctx,
    scenarios,
    authorizations,
    corrected,
    [...previousFailures, newFailures],
    progress,
    life - 1,
  );
}

async function correct<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    locations: string[];
    scenarios: IAutoBeRealizeScenarioResult[];
    authorizations: AutoBeRealizeAuthorization[];
    functions: AutoBeRealizeFunction[];
    previousFailures: IAutoBeRealizeFunctionFailure[][];
    failures: IAutoBeRealizeFunctionFailure[];
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeFunction[]> {
  if (props.locations.length === 0) {
    return props.functions;
  }

  const corrected: AutoBeRealizeFunction[] = await executeCachedBatch(
    ctx,
    props.locations.map(
      (location) => async (): Promise<AutoBeRealizeFunction> => {
        const scenario = props.scenarios.find((el) => el.location === location);
        const func = props.functions.find((el) => el.location === location);

        if (!func) {
          throw new Error("No function found for location: " + location);
        }

        const failures: IAutoBeRealizeFunctionFailure[] = props.failures.filter(
          (f) => f.function?.location === location,
        );
        if (failures.length && scenario) {
          try {
            const correctEvent: AutoBeRealizeCorrectEvent | null = await step(
              ctx,
              {
                totalAuthorizations: props.authorizations,
                authorization: scenario.decoratorEvent ?? null,
                scenario,
                function: func,
                previousFailures: props.previousFailures
                  .map((pf) => {
                    const previousFailures: IAutoBeRealizeFunctionFailure[] =
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
    authorization: AutoBeRealizeAuthorization | null;
    totalAuthorizations: AutoBeRealizeAuthorization[];
    scenario: IAutoBeRealizeScenarioResult;
    function: AutoBeRealizeFunction;
    previousFailures: IAutoBeRealizeFunctionFailure[];
    failure: IAutoBeRealizeFunctionFailure;
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeCorrectEvent | null> {
  const dto: Record<string, string> = await getRealizeWriteDto(
    ctx,
    props.scenario.operation,
  );
  const preliminary: AutoBePreliminaryController<"prismaSchemas"> =
    new AutoBePreliminaryController({
      source: SOURCE,
      application: typia.json.application<IAutoBeRealizeCorrectApplication>(),
      kinds: ["prismaSchemas"],
      state: ctx.state(),
    });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeRealizeCorrectApplication.IComplete | null> =
      {
        value: null,
      };
    const result: AutoBeContext.IResult<Model> = await ctx.conversate({
      source: "realizeCorrect",
      controller: createController({
        model: ctx.model,
        functionName: props.scenario.functionName,
        build: (next) => {
          pointer.value = next;
        },
        preliminary,
      }),
      enforceFunctionCall: true,
      ...transformRealizeCorrectHistory(ctx, {
        state: ctx.state(),
        scenario: props.scenario,
        authorization: props.authorization,
        function: props.function,
        dto,
        failures: [...props.previousFailures, props.failure],
        totalAuthorizations: props.totalAuthorizations,
        preliminary,
      }),
    });
    if (pointer.value !== null) {
      pointer.value.draft = await replaceImportStatements(ctx, {
        operation: props.scenario.operation,
        schemas: ctx.state().interface!.document.components.schemas,
        code: pointer.value.draft,
        decoratorType: props.authorization?.payload.name,
      });
      if (pointer.value.revise.final)
        pointer.value.revise.final = await replaceImportStatements(ctx, {
          operation: props.scenario.operation,
          schemas: ctx.state().interface!.document.components.schemas,
          code: pointer.value.revise.final,
          decoratorType: props.authorization?.payload.name,
        });

      const event: AutoBeRealizeCorrectEvent = {
        type: "realizeCorrect",
        kind: "overall",
        id: v7(),
        location: props.scenario.location,
        content: pointer.value.revise.final ?? pointer.value.draft,
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
  build: (next: IAutoBeRealizeCorrectApplication.IComplete) => void;
  preliminary: AutoBePreliminaryController<"prismaSchemas">;
}): ILlmController<Model> {
  assertSchemaModel(props.model);

  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeRealizeCorrectApplication.IProps> =
      typia.validate<IAutoBeRealizeCorrectApplication.IProps>(input);
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
    } satisfies IAutoBeRealizeCorrectApplication,
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBeRealizeCorrectApplication, "chatgpt">({
      validate: {
        process: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBeRealizeCorrectApplication, "claude">({
      validate: {
        process: validate,
      },
    }),
  gemini: (validate: Validator) =>
    typia.llm.application<IAutoBeRealizeCorrectApplication, "gemini">({
      validate: {
        process: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeRealizeCorrectApplication.IProps>;

const SOURCE = "realizeCorrect" satisfies AutoBeEventSource;
