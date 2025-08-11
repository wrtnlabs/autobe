import { IAgenticaController, MicroAgentica } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { transformInterfaceAssetHistories } from "./histories/transformInterfaceAssetHistories";
import { IAutoBeInterfaceOperationApplication } from "./structures/IAutoBeInterfaceOperationApplication";
import {
  IAutoBeInterfaceOperationsReview,
  IAutoBeInterfaceOperationsReviewApplication,
} from "./structures/IAutoBeInterfaceOperationsReviewApplication";

export async function orchestrateInterfaceOperationsReview<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  props: IAutoBeInterfaceOperationsReview.IInput,
): Promise<IAutoBeInterfaceOperationsReview> {
  const pointer: IPointer<IAutoBeInterfaceOperationsReview | null> = {
    value: null,
  };
  const agentica: MicroAgentica<Model> = ctx.createAgent({
    source: "interfaceOperationsReview",
    histories: [
      {
        type: "systemMessage",
        id: v4(),
        created_at: new Date().toISOString(),
        text: AutoBeSystemPromptConstant.INTERFACE_OPERATION,
      },
      ...transformInterfaceAssetHistories(ctx.state()),
      {
        type: "systemMessage",
        id: v4(),
        created_at: new Date().toISOString(),
        text: AutoBeSystemPromptConstant.INTERFACE_OPERATION_REVIEW,
      },
      {
        type: "assistantMessage",
        id: v4(),
        created_at: new Date().toISOString(),
        text: [
          "Review the following API operations:",
          "",
          "```json",
          JSON.stringify(props.operations, null, 2),
          "```",
        ].join("\n"),
      },
    ],
    controller: createReviewController({
      model: ctx.model,
      endpoints: props.endpoints,
      operations: props.operations,
      build: (reviews) => {
        const passed: IAutoBeInterfaceOperationsReview.Success[] = [];
        const failure: IAutoBeInterfaceOperationsReview.Failure[] = [];

        reviews.forEach((review) => {
          const operation = props.operations.find(
            (op) => op.method === review.method && op.path === review.path,
          );
          if (!operation) {
            return;
          }

          if (review.passed) {
            passed.push({
              type: "success",
              endpoint: operation,
            });
          } else {
            failure.push({
              type: "failure",
              endpoint: operation,
              reason: review.reason || "Unknown reason",
            });
          }
        });

        pointer.value = { passed, failure };
      },
    }),
    enforceFunctionCall: false,
  });
  await agentica.conversate("Review the operations").finally(() => {
    const tokenUsage = agentica.getTokenUsage().aggregate;
    ctx.usage().record(tokenUsage, ["interface"]);
  });

  if (pointer.value === null) throw new Error("Failed to review operations.");
  return pointer.value;
}

function createReviewController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  endpoints: AutoBeOpenApi.IEndpoint[]; // total endpoints
  operations: IAutoBeInterfaceOperationApplication.IOperation[]; // review

  build: (
    reviews: IAutoBeInterfaceOperationsReviewApplication.IReview[],
  ) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const validate = (
    next: unknown,
  ): IValidation<IAutoBeInterfaceOperationsReviewApplication.IProps> => {
    const result: IValidation<IAutoBeInterfaceOperationsReviewApplication.IProps> =
      typia.validate<IAutoBeInterfaceOperationsReviewApplication.IProps>(next);
    if (result.success === false) return result;

    const reviews: IAutoBeInterfaceOperationsReviewApplication.IReview[] =
      result.data.reviews;
    const errors: IValidation.IError[] = [];

    reviews.forEach((review, i) => {
      const operation: AutoBeOpenApi.IEndpoint | undefined =
        props.operations.find(
          (op) => op.method === review.method && op.path === review.path,
        );
      if (!operation) {
        errors.push({
          path: `$input.reviews[${i}]`,
          expected: "Valid operation method and path",
          value: review,
          description: `Operation with method "${review.method}" and path "${review.path}" not found in the operations list.`,
        });
      }
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
        props.build(next.reviews);
      },
    } satisfies IAutoBeInterfaceOperationsReviewApplication,
  };
}

const collection = {
  chatgpt: (validator: Validator) =>
    typia.llm.application<
      IAutoBeInterfaceOperationsReviewApplication,
      "chatgpt"
    >({
      validate: {
        reviewOperations: validator,
      },
    }),
  claude: (validator: Validator) =>
    typia.llm.application<
      IAutoBeInterfaceOperationsReviewApplication,
      "claude"
    >({
      validate: {
        reviewOperations: validator,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeInterfaceOperationsReviewApplication.IProps>;
