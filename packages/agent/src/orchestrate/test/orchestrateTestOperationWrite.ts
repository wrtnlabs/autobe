import { IAgenticaController } from "@agentica/core";
import {
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeTestAuthorizeWriteFunction,
  AutoBeTestGenerateWriteFunction,
  AutoBeTestOperationWriteFunction,
  AutoBeTestPrepareWriteFunction,
  AutoBeTestScenario,
  AutoBeTestValidateEvent,
  AutoBeTestWriteEvent,
} from "@autobe/interface";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { NamingConvention } from "typia/lib/utils/NamingConvention";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { validateEmptyCode } from "../../utils/validateEmptyCode";
import { completeTestCode } from "./compile/completeTestCode";
import { getTestScenarioArtifacts } from "./compile/getTestArtifacts";
import { transformTestOperationWriteHistory } from "./histories/transformTestOperationWriteHistory";
import { IAutoBeTestOperationWriteApplication } from "./structures/IAutoBeTestOperationWriteApplication";
import { IAutoBeTestOperationWriteResult } from "./structures/IAutoBeTestOperationWriteResult";
import { IAutoBeTestScenarioArtifacts } from "./structures/IAutoBeTestScenarioArtifacts";
import { getPrerequisites } from "./utils/getPrerequisites";
import { getTestImportFromFunction } from "./utils/getTestImportFromFunction";

export async function orchestrateTestOperationWrite<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  props: {
    instruction: string;
    scenarios: AutoBeTestScenario[];
    events: AutoBeTestValidateEvent[];
  },
): Promise<IAutoBeTestOperationWriteResult[]> {
  const document: AutoBeOpenApi.IDocument | undefined =
    ctx.state().interface?.document;
  if (document === undefined) {
    throw new Error("Cannot write test code because these are no document.");
  }
  const progress: AutoBeProgressEventBase = {
    total: props.scenarios.length,
    completed: 0,
  };
  const result: Array<IAutoBeTestOperationWriteResult | null> =
    await executeCachedBatch(
      ctx,
      /**
       * Generate test code for each scenario. Maps through plans array to
       * create individual test code implementations. Each scenario is processed
       * to generate corresponding test code and progress events.
       */
      props.scenarios.map((scenario) => async (promptCacheKey) => {
        try {
          const artifacts: IAutoBeTestScenarioArtifacts =
            await getTestScenarioArtifacts(ctx, scenario);

          const prerequisites: AutoBeOpenApi.IPrerequisite[] = getPrerequisites(
            {
              document,
              endpoint: scenario.endpoint,
            },
          );

          const authorizationFunctions: AutoBeTestAuthorizeWriteFunction[] =
            props.events
              .filter(
                (
                  e,
                ): e is AutoBeTestValidateEvent & {
                  function: AutoBeTestAuthorizeWriteFunction;
                } => e.function.type === "authorize",
              )
              .map((e) => e.function);

          const generationFunctions: AutoBeTestGenerateWriteFunction[] = [];
          const prepareFunctions: AutoBeTestPrepareWriteFunction[] = [];

          // Get Necessary Functions (generation, prepare only)
          for (const event of props.events) {
            const { function: func } = event;
            if (func.type === "operation" || func.type === "authorize")
              continue;

            const isScenarioEndpoint =
              func.endpoint.method === scenario.endpoint.method &&
              func.endpoint.path === scenario.endpoint.path;

            const isPrerequisiteEndpoint = prerequisites.some(
              (p) =>
                func.endpoint.method === p.endpoint.method &&
                func.endpoint.path === p.endpoint.path,
            );

            if (isScenarioEndpoint || isPrerequisiteEndpoint) {
              if (func.type === "generate") {
                generationFunctions.push(func);
              } else if (func.type === "prepare") {
                prepareFunctions.push(func);
              }
            }
          }

          const event: AutoBeTestWriteEvent = await process(ctx, {
            document,
            scenario,
            authorizationFunctions,
            generationFunctions,
            prepareFunctions,
            artifacts,
            events: props.events,
            progress,
            promptCacheKey,
            instruction: props.instruction,
          });
          ctx.dispatch(event);

          if (event.function.type !== "operation")
            throw new Error(
              `Unexpected testOperationWrite function kind: ${event.function.type}`,
            );

          return {
            type: "operation",
            artifacts,
            function: event.function,
            authorizeFunctions: authorizationFunctions,
            generateFunctions: generationFunctions,
            prepareFunctions,
          } satisfies IAutoBeTestOperationWriteResult;
        } catch {
          return null;
        }
      }),
    );
  return result.filter((r) => r !== null);
}

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    document: AutoBeOpenApi.IDocument;
    events: AutoBeTestValidateEvent[];
    authorizationFunctions: AutoBeTestAuthorizeWriteFunction[];
    generationFunctions: AutoBeTestGenerateWriteFunction[];
    prepareFunctions: AutoBeTestPrepareWriteFunction[];
    scenario: AutoBeTestScenario;
    artifacts: IAutoBeTestScenarioArtifacts;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
    instruction: string;
  },
): Promise<AutoBeTestWriteEvent> {
  const {
    authorizationFunctions,
    generationFunctions,
    prepareFunctions,
    scenario,
    artifacts,
    progress,
    promptCacheKey,
  } = props;
  const pointer: IPointer<IAutoBeTestOperationWriteApplication.IProps | null> =
    {
      value: null,
    };
  const { metric, tokenUsage } = await ctx.conversate({
    source: "testWrite",
    controller: createController({
      model: ctx.model,
      functionName: props.scenario.functionName,
      build: (next) => {
        next.domain = NamingConvention.snake(next.domain);
        pointer.value = next;
      },
    }),
    enforceFunctionCall: true,
    promptCacheKey,
    ...(await transformTestOperationWriteHistory(ctx, {
      authorizationFunctions,
      generationFunctions,
      scenario,
      artifacts,
      instruction: props.instruction,
    })),
  });
  if (pointer.value === null) {
    ++progress.completed;
    throw new Error("Failed to create test code.");
  }

  const operationFunction: AutoBeTestOperationWriteFunction = {
    type: "operation",
    domain: pointer.value.domain,
    content: pointer.value.revise.final ?? pointer.value.draft,
    functionName: props.scenario.functionName,
    location: `test/features/api/${pointer.value.domain}/${props.scenario.functionName}.ts`,
    scenario,
  };

  const importStatement: string = getTestImportFromFunction({
    target: {
      type: "operation",
      artifacts,
      function: operationFunction,
      authorizeFunctions: authorizationFunctions,
      generateFunctions: generationFunctions,
      prepareFunctions,
    },
  });

  if (pointer.value.revise.final)
    pointer.value.revise.final = await completeTestCode(
      ctx,
      artifacts,
      pointer.value.revise.final,
      importStatement,
    );
  pointer.value.draft = await completeTestCode(
    ctx,
    artifacts,
    pointer.value.draft,
    importStatement,
  );
  return {
    type: "testWrite",
    id: v7(),
    created_at: new Date().toISOString(),
    function: {
      type: "operation",
      domain: pointer.value.domain,
      content: pointer.value.revise.final ?? pointer.value.draft,
      functionName: props.scenario.functionName,
      location: `test/features/api/${pointer.value.domain}/${props.scenario.functionName}.ts`,
      scenario,
    },
    metric,
    tokenUsage,
    completed: ++progress.completed,
    total: progress.total,
    step: ctx.state().interface?.step ?? 0,
  } satisfies AutoBeTestWriteEvent;
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  functionName: string;
  build: (next: IAutoBeTestOperationWriteApplication.IProps) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeTestOperationWriteApplication.IProps> =
      typia.validate<IAutoBeTestOperationWriteApplication.IProps>(input);
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
    name: "Create Test Code",
    application,
    execute: {
      write: (next) => {
        props.build(next);
      },
    } satisfies IAutoBeTestOperationWriteApplication,
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBeTestOperationWriteApplication, "chatgpt">({
      validate: {
        write: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBeTestOperationWriteApplication, "claude">({
      validate: {
        write: validate,
      },
    }),
  gemini: (validate: Validator) =>
    typia.llm.application<IAutoBeTestOperationWriteApplication, "gemini">({
      validate: {
        write: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeTestOperationWriteApplication.IProps>;
