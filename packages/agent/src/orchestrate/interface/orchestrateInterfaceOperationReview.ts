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
import { AutoBeCyclinicController } from "../common/AutoBeCyclinicController";
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

  const cyclinic = new AutoBeCyclinicController<
    | "analysisSections"
    | "databaseSchemas"
    | "previousAnalysisSections"
    | "previousDatabaseSchemas"
    | "previousInterfaceOperations"
  >({
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

  return cyclinic.orchestrate<
    IAutoBeInterfaceOperationReviewApplication.IWrite,
    AutoBeOpenApi.IOperation | false
  >(
    ctx,
    // PROCESS: LLM conversation → action
    async (context) => {
      const action: IPointer<
        | {
            type: "write";
            data: IAutoBeInterfaceOperationReviewApplication.IWrite;
          }
        | { type: "complete" }
        | null
      > = { value: null };

      const result: AutoBeContext.IResult = await ctx.conversate({
        source: SOURCE,
        controller: createReviewController({
          cyclinic,
          databaseSchemas: files,
          operation: props.operation,
          action,
        }),
        enforceFunctionCall: false,
        ...transformInterfaceOperationReviewHistory({
          preliminary: context.preliminary,
          operation: props.operation,
        }),
      });
      return { result, action: action.value };
    },
    // VALIDATE: run business logic validation
    async (writeData) => {
      const errors: IValidation.IError[] = [];
      if (writeData.content !== null)
        AutoBeInterfaceOperationProgrammer.validate({
          accessor: "$input.request.content",
          operation: {
            ...props.operation,
            description: writeData.content.description,
            requestBody: writeData.content.requestBody,
            responseBody: writeData.content.responseBody,
          },
          errors,
        });
      if (errors.length !== 0) return { success: false, diagnostics: errors };
      return { success: true };
    },
    // FINALIZE: build result, dispatch event, return
    async (lastWrite, result) => {
      const content: AutoBeOpenApi.IOperation | null =
        lastWrite.content !== null
          ? {
              ...props.operation,
              description: lastWrite.content.description,
              requestBody: lastWrite.content.requestBody,
              responseBody: lastWrite.content.responseBody,
            }
          : null;
      if (content !== null) AutoBeInterfaceOperationProgrammer.fix(content);
      if (result !== null)
        ctx.dispatch({
          type: SOURCE,
          id: v7(),
          operation: props.operation,
          review: lastWrite.review,
          plan: lastWrite.plan,
          content,
          acquisition: cyclinic.getPreliminary().getAcquisition(),
          metric: result.metric,
          tokenUsage: result.tokenUsage,
          created_at: new Date().toISOString(),
          step: ctx.state().analyze?.step ?? 0,
          total: props.progress.total,
          completed: ++props.progress.completed,
        } satisfies AutoBeInterfaceOperationReviewEvent);
      return content ?? false;
    },
  );
}

function createReviewController(props: {
  cyclinic: AutoBeCyclinicController<
    | "analysisSections"
    | "databaseSchemas"
    | "previousAnalysisSections"
    | "previousDatabaseSchemas"
    | "previousInterfaceOperations"
  >;
  databaseSchemas: AutoBeDatabase.IFile[];
  operation: AutoBeOpenApi.IOperation;
  action: IPointer<
    | {
        type: "write";
        data: IAutoBeInterfaceOperationReviewApplication.IWrite;
      }
    | { type: "complete" }
    | null
  >;
}): IAgenticaController.IClass {
  const preliminary: AutoBePreliminaryController<
    | "analysisSections"
    | "databaseSchemas"
    | "previousAnalysisSections"
    | "previousDatabaseSchemas"
    | "previousInterfaceOperations"
  > = props.cyclinic.getPreliminary();

  const validate = (
    next: unknown,
  ): IValidation<IAutoBeInterfaceOperationReviewApplication.IProps> => {
    const result: IValidation<IAutoBeInterfaceOperationReviewApplication.IProps> =
      typia.validate<IAutoBeInterfaceOperationReviewApplication.IProps>(next);
    if (result.success === false) return result;
    const req = result.data.request;
    if (req.type === "write" || req.type === "complete") return result;
    return preliminary.validate({
      thinking: result.data.thinking,
      request: req,
    });
  };

  const application: ILlmApplication = props.cyclinic.fixCompleteAvailability(
    preliminary.fixApplication(
      typia.llm.application<IAutoBeInterfaceOperationReviewApplication>({
        validate: {
          process: validate,
        },
      }),
    ),
  );
  return {
    protocol: "class",
    name: SOURCE,
    application,
    execute: {
      process: (next) => {
        if (next.request.type === "write")
          props.action.value = { type: "write", data: next.request };
        else if (next.request.type === "complete")
          props.action.value = { type: "complete" };
      },
    } satisfies IAutoBeInterfaceOperationReviewApplication,
  };
}

const SOURCE = "interfaceOperationReview" satisfies AutoBeEventSource;
