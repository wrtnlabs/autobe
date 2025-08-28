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
      console.error("Failed to review operations.");
      progress.completed += operations.length;
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
      review: pointer.value.review,
      plan: pointer.value.plan,
      content,
      tokenUsage,
      created_at: new Date().toISOString(),
      step: ctx.state().analyze?.step ?? 0,
      total: progress.total,
      completed: ++progress.completed,
    } satisfies AutoBeInterfaceOperationsReviewEvent);
    return content;
  } catch (error) {
    console.error("Error occurred during interface operations review:", error);
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

    const models: AutoBePrisma.IModel[] = props.prismaSchemas.flatMap(
      (schema) => schema.models,
    );

    result.data.content.forEach((op, index) => {
      // Check if summary or description mentions soft delete
      const mentionsSoftDelete =
        (op.summary && /soft[\s-]?delet/i.test(op.summary)) ||
        (op.description && /soft[\s-]?delet/i.test(op.description));

      if (op.method === "delete") {
        const model = models.find((model) => model.name === op.model_name);

        if (mentionsSoftDelete) {
          // If soft delete is mentioned but no soft_delete_column is specified
          if (!op.soft_delete_column) {
            // Check if any soft-delete capable column exists in the model
            const hasSoftDeleteCapableColumn = model?.plainFields.some(
              (field) =>
                /delete|deleted|deleted_at|deletedAt|is_deleted|isDeleted/i.test(
                  field.name,
                ),
            );

            if (hasSoftDeleteCapableColumn) {
              errors.push({
                expected: `Soft delete column to be specified or summary/description to not mention soft delete`,
                value: "null",
                description: `Mismatch: Operation mentions soft delete but soft_delete_column is not specified, while model has soft-delete capable columns`,
                path: `$input.content[${index}].soft_delete_column`,
              });
            } else {
              errors.push({
                expected: `Summary/description to not mention soft delete when model lacks soft-delete capability`,
                value: `${op.summary || ""} ${op.description || ""}`,
                description: `Mismatch: Operation mentions soft delete but model '${op.model_name}' has no soft-delete capable columns`,
                path: `$input.content[${index}].summary || $input.content[${index}].description`,
              });
            }
          } else {
            // If soft_delete_column is specified, check if it exists in the model
            const column = model?.plainFields.find(
              (el) => el.name === op.soft_delete_column,
            );

            if (!column) {
              errors.push({
                expected: `Field '${op.soft_delete_column}' to exist in model or operation to not mention soft delete`,
                value: "undefined",
                description: `Mismatch: Either the field '${op.soft_delete_column}' should exist in model '${op.model_name}', or the operation should not mention soft delete`,
                path: `$input.content[${index}].soft_delete_column || $input.content[${index}].summary || $input.content[${index}].description`,
              });
            }
          }
        }

        // Also check if soft_delete_column is specified without mentioning soft delete
        if (op.soft_delete_column && !mentionsSoftDelete) {
          errors.push({
            expected: `Consistency between soft_delete_column and operation description`,
            value: `soft_delete_column: ${op.soft_delete_column}`,
            description: `Mismatch: soft_delete_column is specified but soft delete is not mentioned in summary/description`,
            path: `$input.content[${index}]`,
          });
        }
      }
    });

    // not implemented
    if (errors.length !== 0) {
      console.log(JSON.stringify(errors, null, 2));
      return {
        success: false,
        errors,
        data: next,
      };
    }
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
