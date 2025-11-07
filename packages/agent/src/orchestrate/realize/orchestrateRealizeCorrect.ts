import {
  AutoBeProgressEventBase,
  AutoBeRealizeAuthorization,
  AutoBeRealizeCorrectEvent,
  AutoBeRealizeFunction,
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
import { transformRealizeCorrectHistories } from "./histories/transformRealizeCorrectHistories";
import { compileRealizeFiles } from "./internal/compileRealizeFiles";
import { IAutoBeRealizeCorrectApplication } from "./structures/IAutoBeRealizeCorrectApplication";
import { IAutoBeRealizeFunctionFailure } from "./structures/IAutoBeRealizeFunctionFailure";
import { IAutoBeRealizeScenarioResult } from "./structures/IAutoBeRealizeScenarioResult";
import { filterDiagnostics } from "./utils/filterDiagnostics";
import { getRealizeWriteCodeTemplate } from "./utils/getRealizeWriteCodeTemplate";
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
  const pointer: IPointer<IAutoBeRealizeCorrectApplication.IProps | null> = {
    value: null,
  };

  const dto = await getRealizeWriteDto(ctx, props.scenario.operation);
  const { metric, tokenUsage } = await ctx.conversate({
    source: "realizeCorrect",
    controller: createController({
      model: ctx.model,
      functionName: props.scenario.functionName,
      build: (next) => {
        pointer.value = next;
      },
    }),
    histories: transformRealizeCorrectHistories({
      state: ctx.state(),
      scenario: props.scenario,
      authorization: props.authorization,
      dto,
      failures: [...props.previousFailures, props.failure],
      totalAuthorizations: props.totalAuthorizations,
    }),
    enforceFunctionCall: true,
    message: StringUtil.trim`
      Correct the TypeScript code implementation.

      The instruction to write at first was as follows, and the code you received is the code you wrote according to this instruction.
      When modifying, modify the entire code, but not the import statement.

      Below is template code you wrote:

      ${getRealizeWriteCodeTemplate({
        scenario: props.scenario,
        schemas: ctx.state().interface!.document.components.schemas,
        operation: props.scenario.operation,
        authorization: props.authorization ?? null,
      })}

      Current code is as follows:
      \`\`\`typescript
      ${props.function.content}
      \`\`\`
    `,
  });

  if (pointer.value === null) {
    return null;
  }

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
    metric,
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
  functionName: string;
  build: (next: IAutoBeRealizeCorrectApplication.IProps) => void;
}): ILlmController<Model> {
  assertSchemaModel(props.model);

  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeRealizeCorrectApplication.IProps> =
      typia.validate<IAutoBeRealizeCorrectApplication.IProps>(input);
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
    name: "Write code",
    application,
    execute: {
      correct: (next) => {
        props.build(next);
      },
    } satisfies IAutoBeRealizeCorrectApplication,
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBeRealizeCorrectApplication, "chatgpt">({
      validate: {
        correct: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBeRealizeCorrectApplication, "claude">({
      validate: {
        correct: validate,
      },
    }),
  gemini: (validate: Validator) =>
    typia.llm.application<IAutoBeRealizeCorrectApplication, "gemini">({
      validate: {
        correct: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeRealizeCorrectApplication.IProps>;
