import { IAgenticaController } from "@agentica/core";
import {
  AutoBeInterfaceOperationsReviewEvent,
  AutoBeOpenApi,
  AutoBePrisma,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { transformInterfaceOperationsReviewHistories } from "./histories/transformInterfaceOperationsReviewHistories";
import { IAutoBeInterfaceOperationsReviewApplication } from "./structures/IAutoBeInterfaceOperationsReviewApplication";
import { OperationValidator } from "./utils/OperationValidator";

export async function orchestrateInterfaceOperationsReview<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  operations: AutoBeOpenApi.IOperation[],
  progress: AutoBeProgressEventBase,
): Promise<AutoBeOpenApi.IOperation[]> {
  try {
    const files: AutoBePrisma.IFile[] = ctx.state().prisma?.result.data.files!;
    const pointer: IPointer<IAutoBeInterfaceOperationsReviewApplication.IProps | null> =
      {
        value: null,
      };
    const { tokenUsage } = await ctx.conversate({
      source: "interfaceOperationsReview",
      histories: transformInterfaceOperationsReviewHistories(ctx, operations),
      controller: createReviewController({
        model: ctx.model,
        prismaSchemas: files,
        build: (next: IAutoBeInterfaceOperationsReviewApplication.IProps) => {
          pointer.value = next;
        },
      }),
      enforceFunctionCall: false,
      message: "Review the operations",
    });
    if (pointer.value === null) {
      ++progress.completed;
      return [];
    }

    const content: AutoBeOpenApi.IOperation[] = pointer.value.content.map(
      (op) => ({
        ...op,
        authorizationType: null,
      }),
    );

    ctx.dispatch({
      type: "interfaceOperationsReview",
      id: v7(),
      operations: content,
      review: pointer.value.think.review,
      plan: pointer.value.think.plan,
      content,
      tokenUsage,
      created_at: new Date().toISOString(),
      step: ctx.state().analyze?.step ?? 0,
      total: progress.total,
      completed: ++progress.completed,
    } satisfies AutoBeInterfaceOperationsReviewEvent);
    return content;
  } catch {
    ++progress.completed;
    return [];
  }
}

function createReviewController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  prismaSchemas: AutoBePrisma.IFile[];
  build: (reviews: IAutoBeInterfaceOperationsReviewApplication.IProps) => void;
}): IAgenticaController.IClass<Model> {
  const validate = (
    next: unknown,
  ): IValidation<IAutoBeInterfaceOperationsReviewApplication.IProps> => {
    const result: IValidation<IAutoBeInterfaceOperationsReviewApplication.IProps> =
      typia.validate<IAutoBeInterfaceOperationsReviewApplication.IProps>(next);
    if (result.success === false) return result;

    const errors: IValidation.IError[] = [];
    OperationValidator.validate({
      path: "$input.content",
      operations: result.data.content,
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
  const application: ILlmApplication<Model> = collection[
    props.model === "chatgpt" ? "chatgpt" : "claude"
  ](
    validate,
  ) satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>;

  return {
    protocol: "class",
    name: "review",
    application,
    execute: {
      reviewOperations: (next) => {
        props.build(next);
      },
    } satisfies IAutoBeInterfaceOperationsReviewApplication,
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<
      IAutoBeInterfaceOperationsReviewApplication,
      "chatgpt"
    >({
      validate: {
        reviewOperations: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<
      IAutoBeInterfaceOperationsReviewApplication,
      "claude"
    >({
      validate: {
        reviewOperations: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeInterfaceOperationsReviewApplication.IProps>;
