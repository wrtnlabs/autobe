import { IAgenticaController } from "@agentica/core";
import {
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeTestAuthorizeFunction,
  AutoBeTestGenerateFunction,
  AutoBeTestPrepareFunction,
  AutoBeTestScenario,
  AutoBeTestWriteEvent,
} from "@autobe/interface";
import { ILlmApplication, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { NamingConvention } from "typia/lib/utils/NamingConvention";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { validateEmptyCode } from "../../utils/validateEmptyCode";
import { getTestScenarioArtifacts } from "./compile/getTestArtifacts";
import { transformTestOperationWriteHistory } from "./histories/transformTestOperationWriteHistory";
import { AutoBeTestOperationProgrammer } from "./programmers/AutoBeTestOperationProgrammer";
import { IAutoBeTestOperationProcedure } from "./structures/IAutoBeTestOperationProcedure";
import { IAutoBeTestOperationWriteApplication } from "./structures/IAutoBeTestOperationWriteApplication";
import { IAutoBeTestScenarioArtifacts } from "./structures/IAutoBeTestScenarioArtifacts";

export async function orchestrateTestOperationWrite(
  ctx: AutoBeContext,
  props: {
    instruction: string;
    document: AutoBeOpenApi.IDocument;
    scenarios: AutoBeTestScenario[];
    authorizes: AutoBeTestAuthorizeFunction[];
    prepares: AutoBeTestPrepareFunction[];
    generates: AutoBeTestGenerateFunction[];
    progress: AutoBeProgressEventBase;
  },
): Promise<IAutoBeTestOperationProcedure[]> {
  const result: Array<IAutoBeTestOperationProcedure | null> =
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

          const usedActors: Set<string> = new Set(
            artifacts.document.operations
              .map((o) => o.authorizationActor)
              .filter((a) => a !== null),
          );

          const authorizationFunctions: AutoBeTestAuthorizeFunction[] =
            props.authorizes.filter((f) => usedActors.has(f.actor));
          const generationFunctions: AutoBeTestGenerateFunction[] =
            props.generates.filter((f) =>
              artifacts.document.operations.some(
                (o) =>
                  o.method === f.endpoint.method && o.path === f.endpoint.path,
              ),
            );
          const prepareFunctions: AutoBeTestPrepareFunction[] =
            props.prepares.filter((f) =>
              Object.keys(artifacts.document.components.schemas).includes(
                f.typeName,
              ),
            );

          const event: AutoBeTestWriteEvent = await process(ctx, {
            document: props.document,
            scenario,
            authorizes: authorizationFunctions,
            generates: generationFunctions,
            prepares: prepareFunctions,
            artifacts,
            progress: props.progress,
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
            authorizes: authorizationFunctions,
            generates: generationFunctions,
            prepares: prepareFunctions,
          } satisfies IAutoBeTestOperationProcedure;
        } catch {
          return null;
        }
      }),
    );
  return result.filter((r) => r !== null);
}

async function process(
  ctx: AutoBeContext,
  props: {
    document: AutoBeOpenApi.IDocument;
    authorizes: AutoBeTestAuthorizeFunction[];
    generates: AutoBeTestGenerateFunction[];
    prepares: AutoBeTestPrepareFunction[];
    scenario: AutoBeTestScenario;
    artifacts: IAutoBeTestScenarioArtifacts;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
    instruction: string;
  },
): Promise<AutoBeTestWriteEvent> {
  const pointer: IPointer<IAutoBeTestOperationWriteApplication.IProps | null> =
    {
      value: null,
    };
  const { metric, tokenUsage } = await ctx.conversate({
    source: "testWrite",
    controller: createController({
      functionName: props.scenario.functionName,
      build: (next) => {
        next.domain = NamingConvention.snake(next.domain);
        pointer.value = next;
      },
    }),
    enforceFunctionCall: true,
    promptCacheKey: props.promptCacheKey,
    ...(await transformTestOperationWriteHistory(ctx, {
      authorizationFunctions: props.authorizes,
      generationFunctions: props.generates,
      scenario: props.scenario,
      artifacts: props.artifacts,
      instruction: props.instruction,
    })),
  });
  if (pointer.value === null) {
    ++props.progress.completed;
    throw new Error("Failed to create test code.");
  }

  const location: string = `test/features/api/${pointer.value.domain}/${props.scenario.functionName}.ts`;
  return {
    type: "testWrite",
    id: v7(),
    created_at: new Date().toISOString(),
    function: {
      type: "operation",
      domain: pointer.value.domain,
      scenario: props.scenario,
      name: props.scenario.functionName,
      location,
      content: await AutoBeTestOperationProgrammer.replaceImportStatements({
        compiler: await ctx.compiler(),
        artifacts: props.artifacts,
        authorizes: props.authorizes,
        prepares: props.prepares,
        generates: props.generates,
        location,
        content: pointer.value.revise.final ?? pointer.value.draft,
      }),
    },
    metric,
    tokenUsage,
    completed: ++props.progress.completed,
    total: props.progress.total,
    step: ctx.state().interface?.step ?? 0,
  } satisfies AutoBeTestWriteEvent;
}

function createController(props: {
  functionName: string;
  build: (next: IAutoBeTestOperationWriteApplication.IProps) => void;
}): IAgenticaController.IClass {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeTestOperationWriteApplication.IProps> => {
    const result: IValidation<IAutoBeTestOperationWriteApplication.IProps> =
      typia.validate<IAutoBeTestOperationWriteApplication.IProps>(input);
    if (result.success === false) return result;

    const errors: IValidation.IError[] = validateEmptyCode({
      functionName: props.functionName,
      draft: result.data.draft,
      revise: result.data.revise,
      path: "$input",
    });
    return errors.length
      ? {
          success: false,
          errors,
          data: result.data,
        }
      : result;
  };
  const application: ILlmApplication =
    typia.llm.application<IAutoBeTestOperationWriteApplication>({
      validate: {
        write: validate,
      },
    });
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
