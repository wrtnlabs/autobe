import {
  AutoBeEventSource,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeRealizeAuthorization,
  AutoBeRealizeBackwardPropagationEvent,
  AutoBeRealizeCollectorFunction,
  AutoBeRealizeOperationFunction,
  AutoBeRealizeTransformerFunction,
  AutoBeRealizeWriteEvent,
} from "@autobe/interface";
import { IPointer, Mutex, Singleton } from "tstl";
import typia, { ILlmApplication, ILlmController, IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { buildAnalysisContextSections } from "../../utils/RAGRetrieval";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { forceRetry } from "../../utils/forceRetry";
import { getEmbedder } from "../../utils/getEmbedder";
import { validateEmptyCode } from "../../utils/validateEmptyCode";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { convertToSectionEntries } from "../common/internal/convertToSectionEntries";
import { IAnalysisSectionEntry } from "../common/structures/IAnalysisSectionEntry";
import { orchestrateInterfaceSchemaRefine } from "../interface/orchestrateInterfaceSchemaRefine";
import { transformRealizeOperationWriteHistory } from "./histories/transformRealizeOperationWriteHistory";
import { AutoBeRealizeOperationProgrammer } from "./programmers/AutoBeRealizeOperationProgrammer";
import { IAutoBePreliminaryBackwardPropagationOfInterfaceSchema } from "./structures/IAutoBePreliminaryBackwardPropagationOfInterfaceSchema";
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
  const backwardMutex: Mutex = new Mutex();
  const scenarios: IAutoBeRealizeScenarioResult[] = document.operations.map(
    (operation) =>
      AutoBeRealizeOperationProgrammer.getScenario({
        authorizations: props.authorizations,
        operation,
      }),
  );
  return await executeCachedBatch(
    ctx,
    scenarios.map((s) => {
      const counter = new Singleton(() => ++props.progress.completed);
      return async (promptCacheKey: string) => {
        try {
          return await forceRetry(() =>
            process(ctx, {
              document,
              totalAuthorizations: props.authorizations,
              collectors: props.collectors,
              transformers: props.transformers,
              authorization: s.decoratorEvent ?? null,
              scenario: s,
              progress: props.progress,
              counter,
              promptCacheKey,
              backwardMutex,
            }),
          );
        } catch (error) {
          counter.get();
          throw error;
        }
      };
    }),
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
    counter: Singleton<number>;
    promptCacheKey: string;
    backwardMutex: Mutex;
  },
): Promise<AutoBeRealizeOperationFunction> {
  const allSections: IAnalysisSectionEntry[] = convertToSectionEntries(
    ctx.state().analyze?.files ?? [],
  );

  const pathSegments = props.scenario.operation.path
    .split("/")
    .filter((p) => p && !p.startsWith(":") && !p.startsWith("{"));
  const queryText: string = [
    "operation",
    "write",
    props.scenario.operation.method,
    ...pathSegments,
    props.scenario.functionName,
  ].join(" ");

  const ragSections: IAnalysisSectionEntry[] =
    await buildAnalysisContextSections(
      getEmbedder(),
      allSections,
      queryText,
      "TOPK",
      { log: false, logPrefix: "realizeOperationWrite" },
    );

  const preliminary: AutoBePreliminaryController<
    | "analysisSections"
    | "databaseSchemas"
    | "realizeCollectors"
    | "realizeTransformers"
  > = new AutoBePreliminaryController({
    source: SOURCE,
    application:
      typia.json.application<IAutoBeRealizeOperationWriteApplication>(),
    kinds: [
      "analysisSections",
      "databaseSchemas",
      "realizeCollectors",
      "realizeTransformers",
    ],
    dispatch: (e) => ctx.dispatch(e),
    state: ctx.state(),
    all: {
      realizeCollectors: props.collectors,
      realizeTransformers: props.transformers,
    },
    local: {
      realizeCollectors: props.collectors.filter(
        (c) =>
          c.plan.dtoTypeName === props.scenario.operation.requestBody?.typeName,
      ),
      realizeTransformers: props.transformers.filter(
        (t) =>
          t.plan.dtoTypeName ===
          props.scenario.operation.responseBody?.typeName.replace(/^IPage/, ""),
      ),
      analysisSections: ragSections,
    },
  });
  const event: AutoBeRealizeWriteEvent = await preliminary.orchestrate(
    ctx,
    async (out) => {
      const pointer: IPointer<IAutoBeRealizeOperationWriteApplication.IWrite | null> =
        {
          value: null,
        };
      const backwardPointer: IPointer<IAutoBePreliminaryBackwardPropagationOfInterfaceSchema | null> =
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
          onBackwardPropagate: (next) => {
            backwardPointer.value = next;
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
          collectors: props.collectors,
          transformers: props.transformers,
          dto,
          preliminary,
        }),
      });

      // BACKWARD PROPAGATION: refine schemas with mutex to prevent race conditions
      if (backwardPointer.value !== null) {
        await props.backwardMutex.lock();
        try {
          const targetSchemas: Record<string, AutoBeOpenApi.IJsonSchema> = {};
          for (const name of backwardPointer.value.typeNames) {
            const schema = props.document.components.schemas[name];
            if (schema !== undefined) targetSchemas[name] = schema;
          }
          if (Object.keys(targetSchemas).length > 0) {
            ctx.dispatch({
              type: "realizeBackwardPropagation",
              id: v7(),
              typeNames: backwardPointer.value.typeNames,
              reason: backwardPointer.value.reason,
              step: ctx.state().analyze?.step ?? 0,
              created_at: new Date().toISOString(),
            } satisfies AutoBeRealizeBackwardPropagationEvent);
            const backwardProgress: AutoBeProgressEventBase = {
              total: 0,
              completed: 0,
            };
            const refined = await orchestrateInterfaceSchemaRefine(ctx, {
              document: props.document,
              schemas: targetSchemas,
              instruction: backwardPointer.value.reason,
              progress: backwardProgress,
            });
            Object.assign(props.document.components.schemas, refined);
          }
        } finally {
          await props.backwardMutex.unlock();
        }
        return out(result)(null);
      }

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
      return out(result)({
        id: v7(),
        type: "realizeWrite",
        function: functor,
        acquisition: preliminary.getAcquisition(),
        metric: result.metric,
        tokenUsage: result.tokenUsage,
        completed: props.counter.get(),
        total: props.progress.total,
        step: ctx.state().analyze?.step ?? 0,
        created_at: new Date().toISOString(),
      } satisfies AutoBeRealizeWriteEvent);
    },
  );
  ctx.dispatch(event);
  return event.function as AutoBeRealizeOperationFunction;
}

function createController(props: {
  functionName: string;
  build: (next: IAutoBeRealizeOperationWriteApplication.IWrite) => void;
  onBackwardPropagate: (
    next: IAutoBePreliminaryBackwardPropagationOfInterfaceSchema,
  ) => void;
  preliminary: AutoBePreliminaryController<
    | "analysisSections"
    | "databaseSchemas"
    | "realizeCollectors"
    | "realizeTransformers"
  >;
}): ILlmController {
  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeRealizeOperationWriteApplication.IProps> =
      typia.validate<IAutoBeRealizeOperationWriteApplication.IProps>(input);
    if (result.success === false) return result;
    else if (result.data.request.type === "backwardPropagateInterfaceSchema")
      return result;
    else if (result.data.request.type !== "write")
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request: result.data.request,
      });

    const errors: IValidation.IError[] = validateEmptyCode({
      name: props.functionName,
      draft: result.data.request.draft,
      revise: result.data.request.revise,
      path: "$input.request",
      asynchronous: true,
    });
    return errors.length
      ? {
          success: false,
          errors,
          data: result.data,
        }
      : result;
  };

  const application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeRealizeOperationWriteApplication>({
      validate: {
        process: validate,
      },
    }),
  );

  return {
    protocol: "class",
    name: SOURCE,
    application,
    execute: {
      process: (next) => {
        if (next.request.type === "write") props.build(next.request);
        else if (next.request.type === "backwardPropagateInterfaceSchema")
          props.onBackwardPropagate(next.request);
      },
    } satisfies IAutoBeRealizeOperationWriteApplication,
  };
}

type Validator = (
  input: unknown,
) => IValidation<IAutoBeRealizeOperationWriteApplication.IProps>;

const SOURCE = "realizeWrite" satisfies AutoBeEventSource;
