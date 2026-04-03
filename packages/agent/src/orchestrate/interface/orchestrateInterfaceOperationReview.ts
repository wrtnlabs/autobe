import { IAgenticaController } from "@agentica/core";
import {
  AutoBeDatabase,
  AutoBeEventSource,
  AutoBeInterfaceOperationReviewEvent,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { IPointer } from "tstl";
import typia, { ILlmApplication, IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { buildAnalysisContextSections } from "../../utils/RAGRetrieval";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { getEmbedder } from "../../utils/getEmbedder";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { convertToSectionEntries } from "../common/internal/convertToSectionEntries";
import { IAnalysisSectionEntry } from "../common/structures/IAnalysisSectionEntry";
import { transformInterfaceOperationReviewHistory } from "./histories/transformInterfaceOperationReviewHistory";
import { AutoBeInterfaceOperationProgrammer } from "./programmers/AutoBeInterfaceOperationProgrammer";
import { IAutoBeInterfaceOperationReviewApplication } from "./structures/IAutoBeInterfaceOperationReviewApplication";

export async function orchestrateInterfaceOperationReview(
  ctx: AutoBeContext,
  props: {
    operations: AutoBeOpenApi.IOperation[];
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeOpenApi.IOperation[]> {
  const operations: Array<AutoBeOpenApi.IOperation | false> =
    await executeCachedBatch(
      ctx,
      props.operations.map((operation) => async (promptCacheKey) => {
        try {
          return await process(ctx, {
            operation,
            promptCacheKey,
            progress: props.progress,
          });
        } catch {
          ++props.progress.completed;
          return false;
        }
      }),
    );
  return operations.filter((o) => o !== false);
}

async function process(
  ctx: AutoBeContext,
  props: {
    operation: AutoBeOpenApi.IOperation;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<AutoBeOpenApi.IOperation | false> {
  const allSections: IAnalysisSectionEntry[] = convertToSectionEntries(
    ctx.state().analyze?.files ?? [],
  );
  const op = props.operation;
  const pathSegments = op.path
    .split("/")
    .filter((p) => p && !p.startsWith(":") && !p.startsWith("{"));

  // Build rich query text for better retrieval in review
  const queryParts: string[] = [
    "review",
    "operation",
    op.method,
    ...pathSegments,
  ];

  if (op.authorizationActor) {
    queryParts.push(`auth:${op.authorizationActor}`);
  }
  if (op.requestBody?.typeName) {
    queryParts.push(`req:${op.requestBody.typeName}`);
  }
  if (op.responseBody?.typeName) {
    queryParts.push(`res:${op.responseBody.typeName}`);
  }
  if (op.description) {
    const descKeywords = op.description
      .slice(0, 100)
      .split(/\s+/)
      .filter((w) => w.length >= 3)
      .slice(0, 5);
    queryParts.push(...descKeywords);
  }

  const queryText: string = queryParts.join(" ");

  const ragSections: IAnalysisSectionEntry[] =
    await buildAnalysisContextSections(
      getEmbedder(),
      allSections,
      queryText,
      "TOPK",
      { log: false, logPrefix: "interfaceOperationReview" },
    );

  const files: AutoBeDatabase.IFile[] =
    ctx.state().database?.result.data.files!;
  const preliminary: AutoBePreliminaryController<
    | "analysisSections"
    | "databaseSchemas"
    | "previousAnalysisSections"
    | "previousDatabaseSchemas"
    | "previousInterfaceOperations"
  > = new AutoBePreliminaryController({
    application:
      typia.json.application<IAutoBeInterfaceOperationReviewApplication>(),
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
    const pointer: IPointer<IAutoBeInterfaceOperationReviewApplication.IComplete | null> =
      {
        value: null,
      };
    const result: AutoBeContext.IResult = await ctx.conversate({
      source: SOURCE,
      controller: createReviewController({
        preliminary,
        databaseSchemas: files,
        operation: props.operation,
        build: (next: IAutoBeInterfaceOperationReviewApplication.IComplete) => {
          pointer.value = next;
        },
      }),
      enforceFunctionCall: false,
      ...transformInterfaceOperationReviewHistory({
        preliminary,
        operation: props.operation,
      }),
    });
    if (pointer.value === null) return out(result)(null);

    const content: AutoBeOpenApi.IOperation | null =
      pointer.value.content !== null
        ? {
            ...props.operation,
            description: pointer.value.content.description,
            requestBody: pointer.value.content.requestBody,
            responseBody: pointer.value.content.responseBody,
          }
        : null;
    if (content !== null) AutoBeInterfaceOperationProgrammer.fix(content);
    ctx.dispatch({
      type: SOURCE,
      id: v7(),
      operation: props.operation,
      review: pointer.value.review,
      plan: pointer.value.plan,
      content,
      acquisition: preliminary.getAcquisition(),
      metric: result.metric,
      tokenUsage: result.tokenUsage,
      created_at: new Date().toISOString(),
      step: ctx.state().analyze?.step ?? 0,
      total: props.progress.total,
      completed: ++props.progress.completed,
    } satisfies AutoBeInterfaceOperationReviewEvent);
    return out(result)(content ?? false);
  });
}

function createReviewController(props: {
  preliminary: AutoBePreliminaryController<
    | "analysisSections"
    | "databaseSchemas"
    | "previousAnalysisSections"
    | "previousDatabaseSchemas"
    | "previousInterfaceOperations"
  >;
  databaseSchemas: AutoBeDatabase.IFile[];
  operation: AutoBeOpenApi.IOperation;
  build: (
    reviews: IAutoBeInterfaceOperationReviewApplication.IComplete,
  ) => void;
}): IAgenticaController.IClass {
  const validate = (
    next: unknown,
  ): IValidation<IAutoBeInterfaceOperationReviewApplication.IProps> => {
    const result: IValidation<IAutoBeInterfaceOperationReviewApplication.IProps> =
      typia.validate<IAutoBeInterfaceOperationReviewApplication.IProps>(next);
    if (result.success === false) return result;
    else if (result.data.request.type !== "complete")
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request: result.data.request,
      });

    const errors: IValidation.IError[] = [];
    if (result.data.request.content !== null)
      AutoBeInterfaceOperationProgrammer.validate({
        accessor: "$input.request.content",
        operation: {
          ...props.operation,
          description: result.data.request.content.description,
          requestBody: result.data.request.content.requestBody,
          responseBody: result.data.request.content.responseBody,
        },
        errors,
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
    typia.llm.application<IAutoBeInterfaceOperationReviewApplication>({
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
    } satisfies IAutoBeInterfaceOperationReviewApplication,
  };
}

const SOURCE = "interfaceOperationReview" satisfies AutoBeEventSource;
