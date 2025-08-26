import { IAgenticaController } from "@agentica/core";
import {
  AutoBeAnalyzeRole,
  AutoBeInterfaceAuthorization,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { AutoBeInterfaceAuthorizationEvent } from "@autobe/interface/src/events/AutoBeInterfaceAuthorizationEvent";
import { StringUtil } from "@autobe/utils";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { transformInterfaceAuthorizationsHistories } from "./histories/transformInterfaceAuthorizationsHistories";
import { IAutoBeInterfaceAuthorizationsApplication } from "./structures/IAutoBeInterfaceAuthorizationsApplication";

export async function orchestrateInterfaceAuthorizations<
  Model extends ILlmSchema.Model,
>(ctx: AutoBeContext<Model>): Promise<AutoBeInterfaceAuthorization[]> {
  const roles: AutoBeAnalyzeRole[] = ctx.state().analyze?.roles ?? [];
  const progress: AutoBeProgressEventBase = {
    total: roles.length,
    completed: 0,
  };
  const authorizations: AutoBeInterfaceAuthorization[] =
    await executeCachedBatch(
      roles.map((role) => async () => {
        const event: AutoBeInterfaceAuthorizationEvent = await process(
          ctx,
          role,
          progress,
        );
        ctx.dispatch(event);
        return {
          role: role.name,
          operations: event.operations,
        };
      }),
    );

  return authorizations;
}

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  role: AutoBeAnalyzeRole,
  progress: AutoBeProgressEventBase,
): Promise<AutoBeInterfaceAuthorizationEvent> {
  const pointer: IPointer<IAutoBeInterfaceAuthorizationsApplication.IProps | null> =
    {
      value: null,
    };
  const { tokenUsage } = await ctx.conversate({
    source: "interfaceAuthorization",
    histories: transformInterfaceAuthorizationsHistories(ctx.state(), role),
    controller: createController({
      model: ctx.model,
      role: role.name,
      build: (next) => {
        pointer.value = next;
      },
    }),
    enforceFunctionCall: true,
    message: "Create Authorization Operation for the given roles",
  });
  if (pointer.value === null)
    throw new Error("Failed to generate authorization operation.");

  return {
    type: "interfaceAuthorization",
    id: v7(),
    operations: pointer.value.operations,
    completed: ++progress.completed,
    tokenUsage,
    created_at: new Date().toISOString(),
    step: ctx.state().analyze?.step ?? 0,
    total: progress.total,
  } satisfies AutoBeInterfaceAuthorizationEvent;
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  role: string;
  build: (next: IAutoBeInterfaceAuthorizationsApplication.IProps) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const validate = (
    next: unknown,
  ): IValidation<IAutoBeInterfaceAuthorizationsApplication.IProps> => {
    const result: IValidation<IAutoBeInterfaceAuthorizationsApplication.IProps> =
      typia.validate<IAutoBeInterfaceAuthorizationsApplication.IProps>(next);
    if (result.success === false) return result;

    const errors: IValidation.IError[] = [];
    result.data.operations.forEach((op, i) => {
      // validate authorizationRole
      if (op.authorizationRole !== null) {
        op.authorizationRole = props.role;
      }

      // validate responseBody.typeName -> must be ~.IAuthorized
      if (op.authorizationType === null) return;
      else if (op.responseBody === null)
        errors.push({
          path: `$input.operations.${i}.responseBody`,
          expected:
            "Response body with I{RoleName(PascalCase)}.IAuthorized type is required",
          value: op.responseBody,
          description: [
            "Response body is required for authentication operations.",
            "",
            "The responseBody must contain description and typeName fields.",
            "typeName must be I{Prefix(PascalCase)}{RoleName(PascalCase)}.IAuthorized",
            "description must be a detailed description of the response body.",
          ].join("\n"),
        });
      else if (!op.responseBody.typeName.endsWith(".IAuthorized"))
        errors.push({
          path: `$input.operations.${i}.responseBody.typeName`,
          expected: `Type name must be I{RoleName(PascalCase)}.IAuthorized`,
          value: op.responseBody?.typeName,
          description: [
            `Wrong response body type name: ${op.responseBody?.typeName}`,
            "",
            `For authentication operations (login, join, refresh), the response body type name must follow the convention "I{RoleName}.IAuthorized".`,
            ``,
            `This standardized naming convention ensures consistency across all authentication endpoints and clearly identifies authorization response types.`,
            `The Role name should be in PascalCase format (e.g., IUser.IAuthorized, IAdmin.IAuthorized, ISeller.IAuthorized).`,
          ].join("\n"),
        });
    });

    // validate authorization types' existence
    type AuthorizationType = NonNullable<
      AutoBeOpenApi.IOperation["authorizationType"]
    >;
    const authorizationTypes: Set<AuthorizationType> = new Set(
      result.data.operations
        .map((o) => o.authorizationType)
        .filter((v) => v !== null),
    );
    for (const type of typia.misc.literals<AuthorizationType>())
      if (authorizationTypes.has(type) === false)
        errors.push({
          path: "$input.operations[].authorizationType",
          expected: StringUtil.trim`{
          ...(AutoBeOpenApi.IOperation data),
          authorizationType: "${type}"
        }`,
          value: `No authorizationType "${type}" found in any operation`,
          description: StringUtil.trim`
          There must be an operation that has defined AutoBeOpenApi.IOperation.authorizationType := "${type}"
          for the "${props.role}" role's authorization activity; "${type}".

          However, none of the operations have the AutoBeOpenApi.IOperation.authorizationType := "${type}" 
          value, so that the "${props.role}" cannot perform the authorization ${type} activity.

          Please make that operation at the next function calling. You have to do it.
        `,
        });
    if (errors.length !== 0) {
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
    name: "Create Authorization Interface",
    application,
    execute: {
      makeOperations: (next) => {
        props.build(next);
      },
    } satisfies IAutoBeInterfaceAuthorizationsApplication,
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBeInterfaceAuthorizationsApplication, "chatgpt">(
      {
        validate: {
          makeOperations: validate,
        },
      },
    ),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBeInterfaceAuthorizationsApplication, "claude">({
      validate: {
        makeOperations: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeInterfaceAuthorizationsApplication.IProps>;
