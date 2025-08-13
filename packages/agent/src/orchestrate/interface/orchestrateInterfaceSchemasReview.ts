import { IAgenticaController } from "@agentica/core";
import {
  AutoBeInterfaceSchemasReviewEvent,
  AutoBeOpenApi,
} from "@autobe/interface";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { transformInterfaceSchemasReviewHistories } from "./histories/transformInterfaceSchemasReviewHistories";
import { IAutoBeInterfaceSchemasReviewApplication } from "./structures/IAutobeInterfaceSchemasReviewApplication";

export async function orchestrateInterfaceSchemasReview<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  operations: AutoBeOpenApi.IOperation[],
  schemas: Record<
    string,
    AutoBeOpenApi.IJsonSchemaDescriptive<AutoBeOpenApi.IJsonSchema>
  >,
  progress: { total: number; completed: number },
): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> {
  const pointer: IPointer<IAutoBeInterfaceSchemasReviewApplication.IProps | null> =
    {
      value: null,
    };

  const { tokenUsage } = await ctx.conversate({
    source: "interfaceSchemasReview",
    controller: createController({
      model: ctx.model,
      pointer,
      schemas,
    }),
    histories: transformInterfaceSchemasReviewHistories(
      ctx.state(),
      operations,
      schemas,
    ),
    enforceFunctionCall: true,
    message: "Review type schemas.",
  });
  if (pointer.value === null)
    throw new Error("Failed to extract review information.");

  ctx.dispatch({
    type: "interfaceSchemasReview",
    schemas: schemas,
    review: pointer.value.review,
    plan: pointer.value.plan,
    content: pointer.value.content,
    tokenUsage,
    step: ctx.state().analyze?.step ?? 0,
    total: progress.total,
    completed: ++progress.completed,
    created_at: new Date().toISOString(),
  } satisfies AutoBeInterfaceSchemasReviewEvent);
  return pointer.value.content;
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  pointer: IPointer<IAutoBeInterfaceSchemasReviewApplication.IProps | null>;
  schemas: Record<
    string,
    AutoBeOpenApi.IJsonSchemaDescriptive<AutoBeOpenApi.IJsonSchema>
  >;
}): IAgenticaController.IClass<Model> {
  const validate = (
    next: unknown,
  ): IValidation<IAutoBeInterfaceSchemasReviewApplication.IProps> => {
    const result: IValidation<IAutoBeInterfaceSchemasReviewApplication.IProps> =
      typia.validate<IAutoBeInterfaceSchemasReviewApplication.IProps>(next);
    if (result.success === false) return result;

    const errors: IValidation.IError[] = [];
    if (Object.keys(result.data.content).length === 0) {
      console.log();
      console.log();
      console.log();
      console.log(
        JSON.stringify({ schemas: props.schemas, ...result.data }, null, 2),
      );
      errors.push({
        path: `$input.content`,
        expected: `Content must not be empty. If it's at a level that can't be fixed, please create a schema instead to meet the requirements.`,
        value: result.data.content,
      });
    }

    if (errors.length > 0) {
      return {
        success: false,
        errors,
        data: result.data,
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
    name: "Reviewer",
    application,
    execute: {
      review: (input) => {
        props.pointer.value = input;
      },
    } satisfies IAutoBeInterfaceSchemasReviewApplication,
  };
}
const claude = (validate: Validator) =>
  typia.llm.application<IAutoBeInterfaceSchemasReviewApplication, "claude">({
    validate: {
      review: validate,
    },
  });

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBeInterfaceSchemasReviewApplication, "chatgpt">({
      validate: {
        review: validate,
      },
    }),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeInterfaceSchemasReviewApplication.IProps>;
