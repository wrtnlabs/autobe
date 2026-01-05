import { IAgenticaController } from "@agentica/core";
import {
  AutoBeDatabase,
  AutoBeEventSource,
  AutoBeInterfaceOperationReviewEvent,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { ILlmApplication, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformInterfaceOperationReviewHistory } from "./histories/transformInterfaceOperationReviewHistory";
import { IAutoBeInterfaceOperationReviewApplication } from "./structures/IAutoBeInterfaceOperationReviewApplication";
import { OperationValidator } from "./utils/OperationValidator";

export async function orchestrateInterfaceOperationReview(
  ctx: AutoBeContext,
  props: {
    operations: AutoBeOpenApi.IOperation[];
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeOpenApi.IOperation[]> {
  const operations: Array<AutoBeOpenApi.IOperation | null> =
    await executeCachedBatch(
      ctx,
      props.operations.map(
        (operation) => async (promptCacheKey) =>
          process(ctx, {
            operation,
            promptCacheKey,
            progress: props.progress,
          }),
      ),
    );
  return operations.filter((o) => o !== null);
}

async function process(
  ctx: AutoBeContext,
  props: {
    operation: AutoBeOpenApi.IOperation;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<AutoBeOpenApi.IOperation | null> {
  const files: AutoBeDatabase.IFile[] =
    ctx.state().database?.result.data.files!;
  const preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "databaseSchemas"
    | "previousAnalysisFiles"
    | "previousDatabaseSchemas"
    | "previousInterfaceOperations"
  > = new AutoBePreliminaryController({
    application:
      typia.json.application<IAutoBeInterfaceOperationReviewApplication>(),
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
    const pointer: IPointer<IAutoBeInterfaceOperationReviewApplication.IComplete | null> =
      {
        value: null,
      };
    const result: AutoBeContext.IResult = await ctx.conversate({
      source: SOURCE,
      controller: createReviewController({
        preliminary,
        databaseSchemas: files,
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

    ctx.dispatch({
      type: SOURCE,
      id: v7(),
      operation: props.operation,
      review: pointer.value.think.review,
      plan: pointer.value.think.plan,
      content: pointer.value.content,
      metric: result.metric,
      tokenUsage: result.tokenUsage,
      created_at: new Date().toISOString(),
      step: ctx.state().analyze?.step ?? 0,
      total: props.progress.total,
      completed: ++props.progress.completed,
    } satisfies AutoBeInterfaceOperationReviewEvent);
    return out(result)(pointer.value.content);
  });
}

function createReviewController(props: {
  preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "databaseSchemas"
    | "previousAnalysisFiles"
    | "previousDatabaseSchemas"
    | "previousInterfaceOperations"
  >;
  databaseSchemas: AutoBeDatabase.IFile[];
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
      OperationValidator.validate({
        path: "$input.request.content",
        operation: result.data.request.content,
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
