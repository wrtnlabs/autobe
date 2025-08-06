import { IAgenticaController, MicroAgentica } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { enforceToolCall } from "../../utils/enforceToolCall";
import { transformInterfaceAssetHistories } from "./histories/transformInterfaceAssetHistories";
import { IAutoBeInterfaceOperationApplication } from "./structures/IAutoBeInterfaceOperationApplication";
import { IAutoBeInterfaceOperationReviewApplication } from "./structures/IAutoBeInterfaceOperationReviewApplication";

export namespace IAutoBeInterfaceOperationReview {
  export interface Success {
    type: "success";
    endpoint: AutoBeOpenApi.IEndpoint;
  }

  export interface Failure {
    type: "failure";
    endpoint: AutoBeOpenApi.IEndpoint;
    reason: string;
  }
}
export interface IAutoBeInterfaceOperationReview {
  passed: IAutoBeInterfaceOperationReview.Success[];
  failure: IAutoBeInterfaceOperationReview.Failure[];
}

export async function orchestrateInterfaceOperationReview<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  endpoints: AutoBeOpenApi.IEndpoint[], // total endpoints
  operations: IAutoBeInterfaceOperationApplication.IOperation[],
): Promise<IAutoBeInterfaceOperationReview> {
  const pointer: IPointer<IAutoBeInterfaceOperationReview | null> = {
    value: null,
  };

  const agentica: MicroAgentica<Model> = new MicroAgentica({
    model: ctx.model,
    vendor: ctx.vendor,
    config: {
      ...(ctx.config ?? {}),
      executor: {
        describe: null,
      },
    },
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
          JSON.stringify(operations, null, 2),
          "```",
        ].join("\n"),
      },
    ],
    controllers: [
      createReviewController({
        model: ctx.model,
        endpoints,
        operations,
        build: (reviews) => {
          const passed: IAutoBeInterfaceOperationReview.Success[] = [];
          const failure: IAutoBeInterfaceOperationReview.Failure[] = [];

          reviews.forEach((review) => {
            const operation = operations.find(
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
    ],
  });

  enforceToolCall(agentica);

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
  operations: IAutoBeInterfaceOperationApplication.IOperation[];
  build: (
    reviews: IAutoBeInterfaceOperationReviewApplication.IReview[],
  ) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const validate = (
    next: unknown,
  ): IValidation<IAutoBeInterfaceOperationReviewApplication.IProps> => {
    const result: IValidation<IAutoBeInterfaceOperationReviewApplication.IProps> =
      typia.validate<IAutoBeInterfaceOperationReviewApplication.IProps>(next);
    if (result.success === false) return result;

    const reviews: IAutoBeInterfaceOperationReviewApplication.IReview[] =
      result.data.reviews;
    const errors: IValidation.IError[] = [];

    reviews.forEach((review, i) => {
      const operation: AutoBeOpenApi.IEndpoint | undefined =
        props.endpoints.find(
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
    } satisfies IAutoBeInterfaceOperationReviewApplication,
  };
}

const collection = {
  chatgpt: (validator: Validator) =>
    typia.llm.application<
      IAutoBeInterfaceOperationReviewApplication,
      "chatgpt"
    >({
      validate: {
        reviewOperations: validator,
      },
    }),
  claude: (validator: Validator) =>
    typia.llm.application<IAutoBeInterfaceOperationReviewApplication, "claude">(
      {
        validate: {
          reviewOperations: validator,
        },
      },
    ),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeInterfaceOperationReviewApplication.IProps>;
