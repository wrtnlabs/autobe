import { IAgenticaController } from "@agentica/core";
import {
  AutoBeAnalyzeHistory,
  AutoBeEventSource,
  AutoBeInterfaceEndpointDesign,
  AutoBeInterfaceOperationEvent,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { AutoBeOpenApiEndpointComparator } from "@autobe/utils";
import { NamingConvention } from "@typia/utils";
import { HashMap, IPointer, Pair } from "tstl";
import typia, { ILlmApplication, IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { buildAnalysisContextSections } from "../../utils/RAGRetrieval";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { forceRetry } from "../../utils/forceRetry";
import { getEmbedder } from "../../utils/getEmbedder";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { convertToSectionEntries } from "../common/internal/convertToSectionEntries";
import { IAnalysisSectionEntry } from "../common/structures/IAnalysisSectionEntry";
import { transformInterfaceOperationHistory } from "./histories/transformInterfaceOperationHistory";
import { orchestrateInterfaceOperationReview } from "./orchestrateInterfaceOperationReview";
import { AutoBeInterfaceAuthorizationProgrammer } from "./programmers/AutoBeInterfaceAuthorizationProgrammer";
import { AutoBeInterfaceOperationProgrammer } from "./programmers/AutoBeInterfaceOperationProgrammer";
import { IAutoBeInterfaceOperationApplication } from "./structures/IAutoBeInterfaceOperationApplication";
import { AutoBeJsonSchemaCollection } from "./utils/AutoBeJsonSchemaCollection";
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
        try {
          const row: AutoBeOpenApi.IOperation[] = await forceRetry(
            () =>
              process(ctx, {
                design,
                progress,
                promptCacheKey,
                instruction: props.instruction,
              }),
            3,
            () => true,
          );
          return row;
        } catch (error) {
          console.log("operation", design, error);
          throw error;
        }
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
    collection: new AutoBeJsonSchemaCollection({}, {}),
  });

  const analyze: AutoBeAnalyzeHistory = ctx.state().analyze!;
  const sessionTypeNames: string[] = analyze.actors.map((actor) =>
    AutoBeInterfaceAuthorizationProgrammer.getSessionTypeName({
      prefix: analyze.prefix,
      actor: actor.name,
    }),
  );
  if (sessionTypeNames.length === 0) return operations;
  return operations.filter((op) => {
    const predicate = (typeName: string | undefined): boolean => {
      if (typeName === undefined) return true;
      return sessionTypeNames.every(
        (x) => typeName !== `${x}.ICreate` && typeName !== `${x}.IUpdate`,
      );
    };
    return (
      predicate(op.requestBody?.typeName) &&
      predicate(op.responseBody?.typeName)
    );
  });
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
  const allSections: IAnalysisSectionEntry[] = convertToSectionEntries(
    ctx.state().analyze?.files ?? [],
  );
  const pathSegments = props.design.endpoint.path
    .split("/")
    .filter((p) => p && !p.startsWith(":") && !p.startsWith("{"));
  const queryText: string = [
    "operation",
    props.design.endpoint.method,
    ...pathSegments,
  ].join(" ");

  const ragSections: IAnalysisSectionEntry[] =
    await buildAnalysisContextSections(
      getEmbedder(),
      allSections,
      queryText,
      "TOPK",
      { log: false, logPrefix: "interfaceOperation" },
    );

  const prefix: string = NamingConvention.camel(ctx.state().analyze!.prefix);
  const preliminary: AutoBePreliminaryController<
    | "analysisSections"
    | "databaseSchemas"
    | "previousAnalysisSections"
    | "previousDatabaseSchemas"
    | "previousInterfaceOperations"
  > = new AutoBePreliminaryController({
    application: typia.json.application<IAutoBeInterfaceOperationApplication>(),
    source: SOURCE,
    kinds: [
      "analysisSections",
      "databaseSchemas",
      "previousAnalysisSections",
      "previousDatabaseSchemas",
      "previousInterfaceOperations",
    ],
    state: ctx.state(),
    local: {
      analysisSections: ragSections,
    },
  });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeInterfaceOperationApplication.IWrite | null> =
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

    AutoBeInterfaceOperationProgrammer.fix(pointer.value.operation);
    for (const p of pointer.value.operation.parameters)
      p.schema = AutoBeJsonSchemaFactory.fixSchema(p.schema);

    // Use authorizationActors from endpoint design (not from LLM)
    const authorizationActors: string[] = props.design.authorizationActors;
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
      acquisition: preliminary.getAcquisition(),
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
    | "analysisSections"
    | "databaseSchemas"
    | "previousAnalysisSections"
    | "previousDatabaseSchemas"
    | "previousInterfaceOperations"
  >;
  build: (operation: IAutoBeInterfaceOperationApplication.IWrite) => void;
}): IAgenticaController.IClass {
  const validate = (
    next: unknown,
  ): IValidation<IAutoBeInterfaceOperationApplication.IProps> => {
    const result: IValidation<IAutoBeInterfaceOperationApplication.IProps> =
      typia.validate<IAutoBeInterfaceOperationApplication.IProps>(next);
    if (result.success === false) return result;
    else if (result.data.request.type !== "write")
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request: result.data.request,
      });

    const errors: IValidation.IError[] = [];
    AutoBeInterfaceOperationProgrammer.validate({
      accessor: "$input.request.operation",
      errors,
      operation: result.data.request.operation,
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
        if (next.request.type === "write") props.build(next.request);
      },
    } satisfies IAutoBeInterfaceOperationApplication,
  };
}

const SOURCE = "interfaceOperation" satisfies AutoBeEventSource;
