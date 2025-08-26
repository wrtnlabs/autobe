import { IAgenticaController } from "@agentica/core";
import {
  AutoBeInterfaceSchemasEvent,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { OpenApiV3_1Emender } from "@samchon/openapi/lib/converters/OpenApiV3_1Emender";
import { IPointer } from "tstl";
import typia, { tags } from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { divideArray } from "../../utils/divideArray";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { transformInterfaceSchemaHistories } from "./histories/transformInterfaceSchemaHistories";
import { orchestrateInterfaceSchemasReview } from "./orchestrateInterfaceSchemasReview";
import { IAutoBeInterfaceSchemaApplication } from "./structures/IAutoBeInterfaceSchemaApplication";
import { validateAuthorizationSchema } from "./utils/validateAuthorizationSchema";

export async function orchestrateInterfaceSchemas<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  operations: AutoBeOpenApi.IOperation[],
  capacity: number = 8,
): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> {
  const typeNames: Set<string> = new Set();
  for (const op of operations) {
    if (op.requestBody !== null) typeNames.add(op.requestBody.typeName);
    if (op.responseBody !== null) typeNames.add(op.responseBody.typeName);
  }
  const matrix: string[][] = divideArray({
    array: Array.from(typeNames),
    capacity,
  });
  const progress: AutoBeProgressEventBase = {
    total: typeNames.size,
    completed: 0,
  };
  const progressId: string = v7();
  const reviewProgress: AutoBeProgressEventBase = {
    total: matrix.length,
    completed: 0,
  };
  const reviewProgressId: string = v7();
  const roles: string[] =
    ctx.state().analyze?.roles.map((role) => role.name) ?? [];

  const x: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
    roles.length > 0
      ? {
          IAuthorizationToken: authTokenSchema,
        }
      : {};
  for (const y of await executeCachedBatch(
    matrix.map((it) => async () => {
      const row: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
        await divideAndConquer(ctx, operations, it, 3, progress, progressId);
      const newbie: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
        await orchestrateInterfaceSchemasReview(
          ctx,
          operations,
          row,
          reviewProgress,
          reviewProgressId,
        );
      return { ...row, ...newbie };
    }),
  )) {
    Object.assign(x, y);
  }
  if (x.IAuthorizationToken) x.IAuthorizationToken = authTokenSchema;
  return x;
}

async function divideAndConquer<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  operations: AutoBeOpenApi.IOperation[],
  typeNames: string[],
  retry: number,
  progress: AutoBeProgressEventBase,
  progressId: string,
): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> {
  const remained: Set<string> = new Set(typeNames);
  const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> = {};
  for (let i: number = 0; i < retry; ++i) {
    if (remained.size === 0) break;
    const newbie: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
      await process(ctx, operations, schemas, remained, progress, progressId);
    for (const key of Object.keys(newbie)) {
      schemas[key] = newbie[key];
      remained.delete(key);
    }
  }
  return schemas;
}

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  operations: AutoBeOpenApi.IOperation[],
  oldbie: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>,
  remained: Set<string>,
  progress: AutoBeProgressEventBase,
  progressId: string,
): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> {
  const already: string[] = Object.keys(oldbie);
  const pointer: IPointer<Record<
    string,
    AutoBeOpenApi.IJsonSchemaDescriptive
  > | null> = {
    value: null,
  };
  const { tokenUsage } = await ctx.conversate({
    source: "interfaceSchemas",
    histories: transformInterfaceSchemaHistories(ctx.state(), operations),
    controller: createController({
      model: ctx.model,
      build: async (next) => {
        pointer.value ??= {};
        Object.assign(pointer.value, next);
      },
      pointer,
    }),
    enforceFunctionCall: true,
    message: [
      "Make type components please.",
      "",
      "Here is the list of request/response bodies' type names from",
      "OpenAPI operations. Make type components of them. If more object",
      "types are required during making the components, please make them",
      "too.",
      "",
      ...Array.from(remained).map((k) => `- \`${k}\``),
      ...(already.length !== 0
        ? [
            "",
            "> By the way, here is the list of components schemas what you've",
            "> already made. So, you don't need to make them again.",
            ">",
            ...already.map((k) => `> - \`${k}\``),
          ]
        : []),
    ].join("\n"),
  });
  if (pointer.value === null) throw new Error("Failed to create components.");

  const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
    (
      OpenApiV3_1Emender.convertComponents({
        schemas: pointer.value,
      }) as AutoBeOpenApi.IComponents
    ).schemas ?? {};
  ctx.dispatch({
    type: "interfaceSchemas",
    id: progressId,
    schemas,
    tokenUsage,
    completed: (progress.completed += Object.keys(schemas).length),
    total: (progress.total += Object.keys(schemas).filter(
      (k) => remained.has(k) === false,
    ).length),
    step: ctx.state().prisma?.step ?? 0,
    created_at: new Date().toISOString(),
  } satisfies AutoBeInterfaceSchemasEvent);
  return schemas;
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (
    next: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>,
  ) => Promise<void>;
  pointer: IPointer<Record<
    string,
    AutoBeOpenApi.IJsonSchemaDescriptive
  > | null>;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const validate = (
    next: unknown,
  ): IValidation<IAutoBeInterfaceSchemaApplication.IProps> => {
    const result: IValidation<IAutoBeInterfaceSchemaApplication.IProps> =
      typia.validate<IAutoBeInterfaceSchemaApplication.IProps>(next);
    if (result.success === false) return result;

    // Check all IAuthorized types
    const errors: IValidation.IError[] = [];
    validateAuthorizationSchema({
      errors,
      schemas: result.data.schemas,
      path: "$input.schemas",
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
    name: "interface",
    application,
    execute: {
      makeComponents: async (next) => {
        await props.build(next.schemas);
      },
    } satisfies IAutoBeInterfaceSchemaApplication,
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBeInterfaceSchemaApplication, "chatgpt">({
      validate: {
        makeComponents: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBeInterfaceSchemaApplication, "claude">({
      validate: {
        makeComponents: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeInterfaceSchemaApplication.IProps>;

/**
 * Authorization token response structure.
 *
 * This interface defines the structure of the authorization token response
 * returned after successful user authentication. It contains both access and
 * refresh tokens along with their expiration information.
 *
 * This token structure is automatically included in API schemas when the system
 * detects authorization roles in the requirements analysis phase. It provides a
 * standard format for JWT-based authentication across the generated backend
 * applications.
 */
interface IAuthorizationToken {
  /**
   * JWT access token for authenticated requests.
   *
   * This token should be included in the Authorization header for subsequent
   * authenticated API requests as `Bearer {token}`.
   */
  access: string;

  /**
   * Refresh token for obtaining new access tokens.
   *
   * This token can be used to request new access tokens when the current access
   * token expires, extending the user's session.
   */
  refresh: string;

  /**
   * Access token expiration timestamp.
   *
   * ISO 8601 date-time string indicating when the access token will expire and
   * can no longer be used for authentication.
   */
  expired_at: string & tags.Format<"date-time">;

  /**
   * Refresh token expiration timestamp.
   *
   * ISO 8601 date-time string indicating the latest time until which the
   * refresh token can be used to obtain new access tokens.
   */
  refreshable_until: string & tags.Format<"date-time">;
}

const authTokenSchema: AutoBeOpenApi.IJsonSchemaDescriptive =
  typia.json.schema<IAuthorizationToken>().components.schemas!
    .IAuthorizationToken as AutoBeOpenApi.IJsonSchemaDescriptive;
