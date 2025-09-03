import {
  AutoBeProgressEventBase,
  AutoBeRealizeAuthorization,
  AutoBeRealizeCorrectEvent,
  AutoBeRealizeFunction,
  AutoBeRealizeValidateEvent,
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
import { getRealizeWriteDto } from "./utils/getRealizeWriteDto";
import { replaceImportStatements } from "./utils/replaceImportStatements";

export async function orchestrateRealizeCorrect<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  scenarios: IAutoBeRealizeScenarioResult[],
  authorizations: AutoBeRealizeAuthorization[],
  functions: AutoBeRealizeFunction[],
  failures: IAutoBeRealizeFunctionFailure[],
  progress: IProgress,
  life: number = 5,
): Promise<AutoBeRealizeValidateEvent> {
  const event = await compileRealizeFiles(ctx, { authorizations, functions });
  if (event.result.type === "failure") ctx.dispatch(event);

  if (event.result.type === "success") {
    console.debug("compilation success!");
    return event;
  } else if (--life <= 0) return event;

  const locations: string[] =
    (event.result.type === "failure"
      ? Array.from(new Set(event.result.diagnostics.map((d) => d.file)))
      : null
    )?.filter((el) => el !== null) ?? [];

  progress.total += Object.keys(locations).length;

  const diagnostics =
    event.result.type === "failure" ? event.result.diagnostics : [];

  const diagnosticsByFile = diagnostics.reduce<
    Record<string, typeof diagnostics>
  >((acc, diagnostic) => {
    const location = diagnostic.file!;
    if (!acc[location]) {
      acc[location] = [];
    }
    acc[location].push(diagnostic);
    return acc;
  }, {});

  for (const [location, diagnostics] of Object.entries(diagnosticsByFile)) {
    const func = functions.find((el) => el.location === location);

    if (func) {
      failures.push({
        function: func,
        diagnostics,
      });
    }
  }

  await executeCachedBatch(
    locations.map((location) => async (): Promise<AutoBeRealizeFunction> => {
      const scenario = scenarios.find((el) => el.location === location);
      const func = functions.find((el) => el.location === location)!;
      const ReailzeFunctionFailures: IAutoBeRealizeFunctionFailure[] =
        failures.filter((f) => f.function.location === location);

      if (ReailzeFunctionFailures.length && scenario) {
        const correctEvent = await correct(ctx, {
          totalAuthorizations: authorizations,
          authorization: scenario.decoratorEvent ?? null,
          scenario,
          function: func,
          failures: ReailzeFunctionFailures,
          progress: progress,
        });

        func.content = correctEvent.content;
      }

      return func;
    }),
  );

  return orchestrateRealizeCorrect(
    ctx,
    scenarios,
    authorizations,
    functions,
    failures,
    progress,
    life,
  );
}

export async function correct<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    authorization: AutoBeRealizeAuthorization | null;
    totalAuthorizations: AutoBeRealizeAuthorization[];
    scenario: IAutoBeRealizeScenarioResult;
    function: AutoBeRealizeFunction;
    failures: IAutoBeRealizeFunctionFailure[];
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeCorrectEvent> {
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

  if (pointer.value === null)
    throw new Error("Failed to correct implementation code.");

  pointer.value.revise.implementationCode = await replaceImportStatements(ctx, {
    operation: props.scenario.operation,
    code: pointer.value.revise.implementationCode,
    decoratorType: props.authorization?.payload.name,
  });

  const event: AutoBeRealizeCorrectEvent = {
    type: "realizeCorrect",
    id: v7(),
    location: props.scenario.location,
    content: pointer.value.revise.implementationCode,
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

export interface IProgress {
  total: number;
  completed: number;
}
