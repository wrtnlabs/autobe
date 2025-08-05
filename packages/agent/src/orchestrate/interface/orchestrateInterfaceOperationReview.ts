import { IAgenticaController, MicroAgentica } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia, { tags } from "typia";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { enforceToolCall } from "../../utils/enforceToolCall";
import { transformInterfaceAssetHistories } from "./histories/transformInterfaceAssetHistories";
import { IAutoBeInterfaceOperationApplication } from "./structures/IAutoBeInterfaceOperationApplication";

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

interface IAutoBeInterfaceOperationReviewApplication {
  reviewOperations(
    input: IAutoBeInterfaceOperationReviewApplication.IProps,
  ): void;
}
namespace IAutoBeInterfaceOperationReviewApplication {
  export interface IProps {
    reviews: IReview[];
  }

  export interface IReview {
    method: string;
    path: string;
    passed: boolean;
    reason: (string & tags.MinLength<10>) | null;
  }
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

  const application: ILlmApplication<Model> = collection[
    props.model
  ] as unknown as ILlmApplication<Model>;

  const validate = (next: unknown) => {
    const result: IValidation<IAutoBeInterfaceOperationReviewApplication.IProps> =
      typia.validate<IAutoBeInterfaceOperationReviewApplication.IProps>(next);
    if (result.success === false) return result;

    const reviews = result.data.reviews;
    const errors: IValidation.IError[] = [];

    reviews.forEach((review, i) => {
      const operation = props.endpoints.find(
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

  return {
    protocol: "class",
    name: "review",
    application: {
      ...application,
      functions: [
        {
          ...application.functions[0],
          validate,
        },
      ],
    },
    execute: {
      reviewOperations: (next) => {
        props.build(next.reviews);
      },
    } satisfies IAutoBeInterfaceOperationReviewApplication,
  };
}

const claude = typia.llm.application<
  IAutoBeInterfaceOperationReviewApplication,
  "claude",
  { reference: true }
>();
const collection = {
  chatgpt: typia.llm.application<
    IAutoBeInterfaceOperationReviewApplication,
    "chatgpt",
    { reference: true }
  >(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};
