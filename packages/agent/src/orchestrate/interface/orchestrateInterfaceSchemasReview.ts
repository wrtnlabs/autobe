import { IAgenticaController } from "@agentica/core";
import {
  AutoBeInterfaceSchemasReviewEvent,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { OpenApiV3_1Emender } from "@samchon/openapi/lib/converters/OpenApiV3_1Emender";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { transformInterfaceSchemasReviewHistories } from "./histories/transformInterfaceSchemasReviewHistories";
import { IAutoBeInterfaceSchemasReviewApplication } from "./structures/IAutobeInterfaceSchemasReviewApplication";
import { validateAuthorizationSchema } from "./utils/validateAuthorizationSchema";

export async function orchestrateInterfaceSchemasReview<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  operations: AutoBeOpenApi.IOperation[],
  schemas: Record<
    string,
    AutoBeOpenApi.IJsonSchemaDescriptive<AutoBeOpenApi.IJsonSchema>
  >,
  progress: AutoBeProgressEventBase,
): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> {
  try {
    const pointer: IPointer<IAutoBeInterfaceSchemasReviewApplication.IProps | null> =
      {
        value: null,
      };
    const { tokenUsage } = await ctx.conversate({
      source: "interfaceSchemasReview",
      controller: createController({
        model: ctx.model,
        pointer,
        operations,
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
    if (pointer.value === null) {
      console.error("Failed to extract review information.");
      ++progress.completed;
      return {};
    }

    const content: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> = ((
      OpenApiV3_1Emender.convertComponents({
        schemas: pointer.value.content,
      }) as AutoBeOpenApi.IComponents
    ).schemas ?? {}) as Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
    ctx.dispatch({
      type: "interfaceSchemasReview",
      id: v7(),
      schemas: schemas,
      review: pointer.value.review,
      plan: pointer.value.plan,
      content,
      tokenUsage,
      step: ctx.state().analyze?.step ?? 0,
      total: progress.total,
      completed: ++progress.completed,
      created_at: new Date().toISOString(),
    } satisfies AutoBeInterfaceSchemasReviewEvent);
    return content;
  } catch (error) {
    console.error("Error occurred during interface schemas review:", error);
    ++progress.completed;
    return {};
  }
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  pointer: IPointer<IAutoBeInterfaceSchemasReviewApplication.IProps | null>;
  operations: AutoBeOpenApi.IOperation[];
  schemas: Record<
    string,
    AutoBeOpenApi.IJsonSchemaDescriptive<AutoBeOpenApi.IJsonSchema>
  >;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const validate = (
    next: unknown,
  ): IValidation<IAutoBeInterfaceSchemasReviewApplication.IProps> => {
    const result: IValidation<IAutoBeInterfaceSchemasReviewApplication.IProps> =
      typia.validate<IAutoBeInterfaceSchemasReviewApplication.IProps>(next);
    if (result.success === false) return result;

    const errors: IValidation.IError[] = [];
    validateAuthorizationSchema({
      errors,
      schemas: result.data.content,
      path: "$input.content",
    });

    Object.entries(result.data.content).forEach(
      ([tagName, jsonDescriptive]) => {
        const index: AutoBeOpenApi.IOperation | undefined =
          props.operations.find(
            (op) =>
              op.responseBody?.typeName === tagName &&
              op.method === "patch" &&
              op.name === "index",
          );

        // The index API should return the `IPage<T>` type.
        if (index) {
          // First check if the schema has the correct object structure
          if (
            !("type" in jsonDescriptive) ||
            jsonDescriptive.type !== "object"
          ) {
            errors.push({
              path: `$input.content.${tagName}`,
              expected: `{ type: "object", properties: { ... } }`,
              value: jsonDescriptive,
              description: `IPage schema must have type: "object". Found: ${JSON.stringify(jsonDescriptive)}`,
            });
          } else if (!("properties" in jsonDescriptive)) {
            errors.push({
              path: `$input.content.${tagName}`,
              expected: `Schema with "properties" field`,
              value: jsonDescriptive,
              description: `IPage schema must have a "properties" field containing "pagination" and "data" properties.`,
            });
          } else if (
            typia.is<AutoBeOpenApi.IJsonSchema.IObject>(jsonDescriptive)
          ) {
            jsonDescriptive.properties ??= {};

            // Check pagination property
            const pagination = jsonDescriptive.properties["pagination"];
            if (!pagination || !("$ref" in pagination)) {
              errors.push({
                path: `$input.content.${tagName}.properties.pagination`,
                expected: `{ $ref: "#/components/schemas/IPage.IPagination" }`,
                value: pagination,
                description: `IPage must have a "pagination" property with $ref to IPage.IPagination.`,
              });
            }

            // Check data property
            const data = jsonDescriptive.properties["data"];
            if (!typia.is<AutoBeOpenApi.IJsonSchema.IArray>(data)) {
              errors.push({
                path: `$input.content.${tagName}.properties.data`,
                expected: `AutoBeOpenApi.IJsonSchema.IArray`,
                value: data,
                description: `The 'data' property must be an array for the index operation.`,
              });
            } else {
              // Check if array items have proper type reference (not 'any')
              const arraySchema: AutoBeOpenApi.IJsonSchema.IArray = data;
              if (
                !arraySchema.items ||
                !("$ref" in arraySchema.items) ||
                arraySchema.items.$ref === "#/components/schemas/any"
              ) {
                errors.push({
                  path: `$input.content.${tagName}.properties.data.items`,
                  expected: `Reference to a specific type (e.g., $ref to ISummary type)`,
                  value: arraySchema.items,
                  description: `The 'data' array must have a specific item type, not 'any[]'. Use a proper type reference like '{Entity}.ISummary' for paginated results.`,
                });
              }
            }
          }
        }
      },
    );

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
    name: "Reviewer",
    application,
    execute: {
      review: (input) => {
        props.pointer.value = input;
      },
    } satisfies IAutoBeInterfaceSchemasReviewApplication,
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBeInterfaceSchemasReviewApplication, "chatgpt">({
      validate: {
        review: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBeInterfaceSchemasReviewApplication, "claude">({
      validate: {
        review: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeInterfaceSchemasReviewApplication.IProps>;
