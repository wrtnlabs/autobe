import {
  AutoBeEventSource,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeRealizeAuthorization,
  AutoBeRealizeCollectorFunction,
  AutoBeRealizeOperationFunction,
  AutoBeRealizeTransformerFunction,
  AutoBeRealizeWriteEvent,
} from "@autobe/interface";
import { ILlmApplication, ILlmController, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { validateEmptyCode } from "../../utils/validateEmptyCode";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformRealizeOperationWriteHistory } from "./histories/transformRealizeOperationWriteHistory";
import { AutoBeRealizeOperationProgrammer } from "./programmers/AutoBeRealizeOperationProgrammer";
import { IAutoBeRealizeOperationWriteApplication } from "./structures/IAutoBeRealizeOperationWriteApplication";
import { IAutoBeRealizeScenarioResult } from "./structures/IAutoBeRealizeScenarioResult";

export async function orchestrateRealizeOperationWrite(
  ctx: AutoBeContext,
  props: {
    authorizations: AutoBeRealizeAuthorization[];
    collectors: AutoBeRealizeCollectorFunction[];
    transformers: AutoBeRealizeTransformerFunction[];
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeOperationFunction[]> {
  const document: AutoBeOpenApi.IDocument = ctx.state().interface!.document;
  const scenarios: IAutoBeRealizeScenarioResult[] = document.operations.map(
    (operation) =>
      AutoBeRealizeOperationProgrammer.getScenario({
        authorizations: props.authorizations,
        operation,
      }),
  );
  return await executeCachedBatch(
    ctx,
    scenarios.map(
      (s) => (promptCacheKey) =>
        process(ctx, {
          document,
          totalAuthorizations: props.authorizations,
          collectors: props.collectors,
          transformers: props.transformers,
          authorization: s.decoratorEvent ?? null,
          scenario: s,
          progress: props.progress,
          promptCacheKey,
        }),
    ),
  );
}

async function process(
  ctx: AutoBeContext,
  props: {
    document: AutoBeOpenApi.IDocument;
    authorization: AutoBeRealizeAuthorization | null;
    collectors: AutoBeRealizeCollectorFunction[];
    totalAuthorizations: AutoBeRealizeAuthorization[];
    scenario: IAutoBeRealizeScenarioResult;
    transformers: AutoBeRealizeTransformerFunction[];
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<AutoBeRealizeOperationFunction> {
  const preliminary: AutoBePreliminaryController<
    "databaseSchemas" | "realizeCollectors" | "realizeTransformers"
  > = new AutoBePreliminaryController({
    source: SOURCE,
    application:
      typia.json.application<IAutoBeRealizeOperationWriteApplication>(),
    kinds: ["databaseSchemas", "realizeCollectors", "realizeTransformers"],
    state: ctx.state(),
    all: {
      realizeCollectors: props.collectors,
      realizeTransformers: props.transformers,
    },
  });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeRealizeOperationWriteApplication.IComplete | null> =
      {
        value: null,
      };
    const dto: Record<string, string> =
      await AutoBeRealizeOperationProgrammer.writeStructures(
        ctx,
        props.scenario.operation,
      );
    const result: AutoBeContext.IResult = await ctx.conversate({
      source: "realizeWrite",
      controller: createController({
        functionName: props.scenario.functionName,
        build: (next) => {
          pointer.value = next;
        },
        preliminary,
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...transformRealizeOperationWriteHistory({
        state: ctx.state(),
        scenario: props.scenario,
        authorization: props.authorization,
        totalAuthorizations: props.totalAuthorizations,
        dto,
        preliminary,
      }),
    });
    if (pointer.value === null) return out(result)(null);

    const functor: AutoBeRealizeOperationFunction = {
      type: "operation",
      endpoint: {
        method: props.scenario.operation.method,
        path: props.scenario.operation.path,
      },
      location: props.scenario.location,
      name: props.scenario.functionName,
      content: await AutoBeRealizeOperationProgrammer.replaceImportStatements(
        ctx,
        {
          operation: props.scenario.operation,
          schemas: props.document.components.schemas,
          code: pointer.value.revise.final ?? pointer.value.draft,
          payload: props.authorization?.payload.name,
        },
      ),
    };
    ctx.dispatch({
      id: v7(),
      type: "realizeWrite",
      function: functor,
      metric: result.metric,
      tokenUsage: result.tokenUsage,
      completed: ++props.progress.completed,
      total: props.progress.total,
      step: ctx.state().analyze?.step ?? 0,
      created_at: new Date().toISOString(),
    } satisfies AutoBeRealizeWriteEvent);
    return out(result)(functor);
  });
}

function createController(props: {
  functionName: string;
  build: (next: IAutoBeRealizeOperationWriteApplication.IComplete) => void;
  preliminary: AutoBePreliminaryController<
    "databaseSchemas" | "realizeCollectors" | "realizeTransformers"
  >;
}): ILlmController {
  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeRealizeOperationWriteApplication.IProps> =
      typia.validate<IAutoBeRealizeOperationWriteApplication.IProps>(input);
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
      path: "$input.request",
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
    typia.llm.application<IAutoBeRealizeOperationWriteApplication>({
      validate: {
        process: validate,
      },
    });
  return {
    protocol: "class",
    name: SOURCE,
    application,
    execute: {
      process: (next) => {
        if (next.request.type === "complete") props.build(next.request);
      },
    } satisfies IAutoBeRealizeOperationWriteApplication,
  };
}

type Validator = (
  input: unknown,
) => IValidation<IAutoBeRealizeOperationWriteApplication.IProps>;

const SOURCE = "realizeWrite" satisfies AutoBeEventSource;
