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
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformInterfaceOperationReviewHistory } from "./histories/transformInterfaceOperationReviewHistory";
import { IAutoBeInterfaceOperationReviewApplication } from "./structures/IAutoBeInterfaceOperationReviewApplication";
import { OperationValidator } from "./utils/OperationValidator";

export async function orchestrateInterfaceOperationReview(
  ctx: AutoBeContext,
  operations: AutoBeOpenApi.IOperation[],
  progress: AutoBeProgressEventBase,
): Promise<AutoBeOpenApi.IOperation[]> {
  try {
    return await process(ctx, operations, progress);
  } catch {
    ++progress.completed;
    return [];
  }
}

async function process(
  ctx: AutoBeContext,
  operations: AutoBeOpenApi.IOperation[],
  progress: AutoBeProgressEventBase,
): Promise<AutoBeOpenApi.IOperation[]> {
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
        operations,
      }),
    });
    if (pointer.value === null) return out(result)(null);

    const content: AutoBeOpenApi.IOperation[] = pointer.value.content.map(
      (op) => ({
        ...op,
        authorizationType: null,
      }),
    );
    ctx.dispatch({
      type: SOURCE,
      id: v7(),
      operations: content,
      review: pointer.value.think.review,
      plan: pointer.value.think.plan,
      content,
      metric: result.metric,
      tokenUsage: result.tokenUsage,
      created_at: new Date().toISOString(),
      step: ctx.state().analyze?.step ?? 0,
      total: progress.total,
      completed: ++progress.completed,
    } satisfies AutoBeInterfaceOperationReviewEvent);
    return out(result)(content);
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
    OperationValidator.validate({
      path: "$input.request.content",
      operations: result.data.request.content,
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
