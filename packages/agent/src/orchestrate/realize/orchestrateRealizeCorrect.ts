import {
  AutoBeProgressEventBase,
  AutoBeRealizeAuthorization,
  AutoBeRealizeCorrectEvent,
  AutoBeRealizeFunction,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { ILlmApplication, ILlmController, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { transformRealizeCorrectHistories } from "./histories/transformRealizeCorrectHistories";
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
  failures: IAutoBeRealizeFunctionFailure[],
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
    event.result.diagnostics.every((d) => !d.file?.startsWith("src/providers"))
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
      const func = functions.find((f) => f.location === location);

      if (!func) {
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

  const newFailures: IAutoBeRealizeFunctionFailure[] = [
    ...failures,
    ...Object.values(diagnosticsByFile),
  ];

  const corrected: AutoBeRealizeFunction[] = await correct(
    ctx,
    locations,
    scenarios,
    authorizations,
    functions,
    filterDiagnostics(
      newFailures,
      functions.map((fn) => fn.location),
    ),
    progress,
  );

  return orchestrateRealizeCorrect(
    ctx,
    scenarios,
    authorizations,
    corrected,
    filterDiagnostics(
      newFailures,
      corrected.map((c) => c.location),
    ),
    progress,
    life - 1,
  );
}

async function correct<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  locations: string[],
  scenarios: IAutoBeRealizeScenarioResult[],
  authorizations: AutoBeRealizeAuthorization[],
  functions: AutoBeRealizeFunction[],
  failures: IAutoBeRealizeFunctionFailure[],
  progress: AutoBeProgressEventBase,
): Promise<AutoBeRealizeFunction[]> {
  if (locations.length === 0) {
    return functions;
  }

  const corrected: AutoBeRealizeFunction[] = await executeCachedBatch(
    locations.map((location) => async (): Promise<AutoBeRealizeFunction> => {
      const scenario = scenarios.find((el) => el.location === location);
      const func = functions.find((el) => el.location === location);

      if (!func) {
        throw new Error("No function found for location: " + location);
      }

      const RealizeFunctionFailures: IAutoBeRealizeFunctionFailure[] =
        failures.filter((f) => f.function?.location === location);

      if (RealizeFunctionFailures.length && scenario) {
        try {
          const correctEvent: AutoBeRealizeCorrectEvent | null = await step(
            ctx,
            {
              totalAuthorizations: authorizations,
              authorization: scenario.decoratorEvent ?? null,
              scenario,
              function: func,
              failures: RealizeFunctionFailures,
              progress: progress,
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
    }),
  );

  // Create a map of corrected functions for efficient lookup
  const correctedMap = new Map(corrected.map((f) => [f.location, f]));

  // Return all functions, with corrected ones replaced
  return functions.map((func) => correctedMap.get(func.location) || func);
}

async function step<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    authorization: AutoBeRealizeAuthorization | null;
    totalAuthorizations: AutoBeRealizeAuthorization[];
    scenario: IAutoBeRealizeScenarioResult;
    function: AutoBeRealizeFunction;
    failures: IAutoBeRealizeFunctionFailure[];
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeCorrectEvent | null> {
  const pointer: IPointer<IAutoBeRealizeCorrectApplication.IProps | null> = {
    value: null,
  };

  const dto = await getRealizeWriteDto(ctx, props.scenario.operation);
  const { tokenUsage } = await ctx.conversate({
    source: "realizeCorrect",
    controller: createController({
      model: ctx.model,
      build: (next) => {
        pointer.value = next;
      },
    }),
    histories: transformRealizeCorrectHistories({
      state: ctx.state(),
      scenario: props.scenario,
      authorization: props.authorization,
      code: props.function.content,
      dto,
      failures: props.failures.filter(
        (f) => f.function.location === props.function.location,
      ),
      totalAuthorizations: props.totalAuthorizations,
    }),
    enforceFunctionCall: true,
    message: StringUtil.trim`
      Correct the TypeScript code implementation.
    `,
  });

  if (pointer.value === null) {
    return null;
  }

  pointer.value.revise.final = await replaceImportStatements(ctx, {
    operation: props.scenario.operation,
    code: pointer.value.revise.final,
    decoratorType: props.authorization?.payload.name,
  });

  const event: AutoBeRealizeCorrectEvent = {
    type: "realizeCorrect",
    id: v7(),
    location: props.scenario.location,
    content: pointer.value.revise.final,
    tokenUsage,
    completed: ++props.progress.completed,
    total: props.progress.total,
    step: ctx.state().analyze?.step ?? 0,
    created_at: new Date().toISOString(),
  };
  ctx.dispatch(event);
  return event;
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (next: IAutoBeRealizeCorrectApplication.IProps) => void;
}): ILlmController<Model> {
  assertSchemaModel(props.model);
  const application: ILlmApplication<Model> = collection[
    props.model
  ] satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>;

  return {
    protocol: "class",
    name: "Write code",
    application,
    execute: {
      review: (next) => {
        props.build(next);
      },
    } satisfies IAutoBeRealizeCorrectApplication,
  };
}

const claude = typia.llm.application<
  IAutoBeRealizeCorrectApplication,
  "claude"
>();
const collection = {
  chatgpt: typia.llm.application<IAutoBeRealizeCorrectApplication, "chatgpt">(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};
