import { IAgenticaController } from "@agentica/core";
import {
  AutoBeEventSource,
  AutoBeInterfaceEndpointDesign,
  AutoBeInterfaceOperationEvent,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { AutoBeOpenApiEndpointComparator } from "@autobe/utils";
import { ILlmApplication, IValidation } from "@samchon/openapi";
import { HashMap, IPointer, Pair } from "tstl";
import typia from "typia";
import { NamingConvention } from "typia/lib/utils/NamingConvention";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformInterfaceOperationHistory } from "./histories/transformInterfaceOperationHistory";
import { orchestrateInterfaceOperationReview } from "./orchestrateInterfaceOperationReview";
import { AutoBeInterfaceOperationProgrammer } from "./programmers/AutoBeInterfaceOperationProgrammer";
import { IAutoBeInterfaceOperationApplication } from "./structures/IAutoBeInterfaceOperationApplication";
import { AutoBeJsonSchemaFactory } from "./utils/AutoBeJsonSchemaFactory";
import { AutoBeJsonSchemaNamingConvention } from "./utils/AutoBeJsonSchemaNamingConvention";

export async function orchestrateInterfaceOperation(
  ctx: AutoBeContext,
  props: {
    instruction: string;
    designs: AutoBeInterfaceEndpointDesign[];
  },
): Promise<AutoBeOpenApi.IOperation[]> {
  // write
  const progress: AutoBeProgressEventBase = {
    total: props.designs.length,
    completed: 0,
  };
  const written: AutoBeOpenApi.IOperation[] = (
    await executeCachedBatch(
      ctx,
      props.designs.map((design) => async (promptCacheKey) => {
        const row: AutoBeOpenApi.IOperation[] = await process(ctx, {
          design,
          progress,
          promptCacheKey,
          instruction: props.instruction,
        });
        return row;
      }),
    )
  ).flat();

  // unique dictionary
  const unique: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation> =
    new HashMap(
      written.map(
        (w) =>
          new Pair(
            {
              path: w.path,
              method: w.method,
            },
            w,
          ),
      ),
      AutoBeOpenApiEndpointComparator.hashCode,
      AutoBeOpenApiEndpointComparator.equals,
    );

  // review
  const reviewProgress: AutoBeProgressEventBase = {
    completed: 0,
    total: written.length,
  };
  const reviewed: AutoBeOpenApi.IOperation[] =
    await orchestrateInterfaceOperationReview(ctx, {
      operations: written,
      progress: reviewProgress,
    });
  for (const r of reviewed)
    unique.set(
      {
        path: r.path,
        method: r.method,
      },
      r,
    );
  const operations: AutoBeOpenApi.IOperation[] = unique
    .toJSON()
    .map((it) => it.second);
  AutoBeJsonSchemaNamingConvention.normalize({
    operations,
    components: {
      authorizations: [],
      schemas: {},
    },
  });
  return operations;
}

async function process(
  ctx: AutoBeContext,
  props: {
    design: AutoBeInterfaceEndpointDesign;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
    instruction: string;
  },
): Promise<AutoBeOpenApi.IOperation[]> {
  const prefix: string = NamingConvention.camel(ctx.state().analyze!.prefix);
  const preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "databaseSchemas"
    | "previousAnalysisFiles"
    | "previousDatabaseSchemas"
    | "previousInterfaceOperations"
  > = new AutoBePreliminaryController({
    application: typia.json.application<IAutoBeInterfaceOperationApplication>(),
    source: SOURCE,
    kinds: [
      "analysisFiles",
      "databaseSchemas",
      "previousAnalysisFiles",
      "previousDatabaseSchemas",
      "previousInterfaceOperations",
    ],
    state: ctx.state(),
  });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeInterfaceOperationApplication.IComplete | null> =
      {
        value: null,
      };
    const result: AutoBeContext.IResult = await ctx.conversate({
      source: SOURCE,
      controller: createController({
        preliminary,
        build: (complete) => {
          pointer.value = complete;
        },
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...transformInterfaceOperationHistory({
        endpoint: props.design.endpoint,
        instruction: props.instruction,
        prefix,
        preliminary,
      }),
    });
    if (pointer.value === null) return out(result)(null);

    for (const p of pointer.value.operation.parameters)
      p.schema = AutoBeJsonSchemaFactory.fixSchema(p.schema);

    // Use authorizationActors from endpoint design (not from LLM)
    const authorizationActors = props.design.authorizationActors;
    const matrix: AutoBeOpenApi.IOperation[] =
      authorizationActors.length === 0
        ? [
            {
              ...pointer.value.operation,
              path:
                "/" +
                [prefix, ...pointer.value.operation.path.split("/")]
                  .filter((it) => it !== "")
                  .join("/"),
              authorizationActor: null,
              authorizationType: null,
              prerequisites: [],
            } satisfies AutoBeOpenApi.IOperation,
          ]
        : authorizationActors.map(
            (actor) =>
              ({
                ...pointer.value!.operation,
                path:
                  "/" +
                  [prefix, actor, ...pointer.value!.operation.path.split("/")]
                    .filter((it) => it !== "")
                    .join("/"),
                authorizationActor: actor,
                authorizationType: null,
                prerequisites: [],
              }) satisfies AutoBeOpenApi.IOperation,
          );
    ++props.progress.completed;

    ctx.dispatch({
      type: SOURCE,
      id: v7(),
      analysis: pointer.value.analysis,
      rationale: pointer.value.rationale,
      operations: matrix,
      metric: result.metric,
      tokenUsage: result.tokenUsage,
      ...props.progress,
      step: ctx.state().analyze?.step ?? 0,
      created_at: new Date().toISOString(),
    } satisfies AutoBeInterfaceOperationEvent);
    return out(result)(matrix);
  });
}

function createController(props: {
  preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "databaseSchemas"
    | "previousAnalysisFiles"
    | "previousDatabaseSchemas"
    | "previousInterfaceOperations"
  >;
  build: (operation: IAutoBeInterfaceOperationApplication.IComplete) => void;
}): IAgenticaController.IClass {
  const validate = (
    next: unknown,
  ): IValidation<IAutoBeInterfaceOperationApplication.IProps> => {
    const result: IValidation<IAutoBeInterfaceOperationApplication.IProps> =
      typia.validate<IAutoBeInterfaceOperationApplication.IProps>(next);
    if (result.success === false) return result;
    else if (result.data.request.type !== "complete")
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request: result.data.request,
      });

    const op: IAutoBeInterfaceOperationApplication.IOperation =
      result.data.request.operation;
    const errors: IValidation.IError[] = [];
    AutoBeInterfaceOperationProgrammer.validate({
      accessor: "$input.request.operation",
      errors,
      operation: op,
    });

    if (errors.length !== 0)
      return {
        success: false,
        errors,
        data: next,
      };
    return result;
  };

  const application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeInterfaceOperationApplication>({
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
        if (next.request.type === "complete") props.build(next.request);
      },
    } satisfies IAutoBeInterfaceOperationApplication,
  };
}

const SOURCE = "interfaceOperation" satisfies AutoBeEventSource;
