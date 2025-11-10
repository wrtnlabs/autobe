import { IAgenticaController } from "@agentica/core";
import {
  AutoBeAnalyzeActor,
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
>(
  ctx: AutoBeContext<Model>,
  instruction: string,
): Promise<AutoBeInterfaceAuthorization[]> {
  const actors: AutoBeAnalyzeActor[] = ctx.state().analyze?.actors ?? [];
  const progress: AutoBeProgressEventBase = {
    total: actors.length,
    completed: 0,
  };
  const authorizations: AutoBeInterfaceAuthorization[] =
    await executeCachedBatch(
      actors.map((a) => async (promptCacheKey) => {
        const event: AutoBeInterfaceAuthorizationEvent = await process(ctx, {
          actor: a,
          progress,
          promptCacheKey,
          instruction,
        });
        ctx.dispatch(event);
        return {
          name: a.name,
          operations: event.operations,
        };
      }),
    );

  return authorizations;
}

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    instruction: string;
    actor: AutoBeAnalyzeActor;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<AutoBeInterfaceAuthorizationEvent> {
  const pointer: IPointer<IAutoBeInterfaceAuthorizationsApplication.IProps | null> =
    {
      value: null,
    };
  const { metric, tokenUsage } = await ctx.conversate({
    source: "interfaceAuthorization",
    controller: createController({
      model: ctx.model,
      actor: props.actor,
      build: (next) => {
        pointer.value = next;
      },
    }),
    enforceFunctionCall: true,
    promptCacheKey: props.promptCacheKey,
    ...transformInterfaceAuthorizationsHistories({
      state: ctx.state(),
      instruction: props.instruction,
      actor: props.actor,
    }),
  });
  if (pointer.value === null)
    throw new Error("Failed to generate authorization operation.");

  return {
    type: "interfaceAuthorization",
    id: v7(),
    operations: pointer.value.operations,
    completed: ++props.progress.completed,
    metric,
    tokenUsage,
    created_at: new Date().toISOString(),
    step: ctx.state().analyze?.step ?? 0,
    total: props.progress.total,
  } satisfies AutoBeInterfaceAuthorizationEvent;
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  actor: AutoBeAnalyzeActor;
  build: (next: IAutoBeInterfaceAuthorizationsApplication.IProps) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const validate = (
    next: unknown,
  ): IValidation<IAutoBeInterfaceAuthorizationsApplication.IProps> => {
    const result: IValidation<IAutoBeInterfaceAuthorizationsApplication.IProps> =
      typia.validate<IAutoBeInterfaceAuthorizationsApplication.IProps>(next);
    if (result.success === false) return result;

    // remove login operation for guest role
    if (props.actor.kind === "guest") {
      result.data.operations = result.data.operations.filter(
        (op) => op.authorizationType !== "login",
      );
    }

    const errors: IValidation.IError[] = [];
    result.data.operations.forEach((op, i) => {
      // validate authorizationActor
      if (op.authorizationActor !== null) {
        op.authorizationActor = props.actor.name;
      }

      // validate responseBody.typeName -> must be ~.IAuthorized
      if (op.authorizationType === null) return;
      else if (op.responseBody === null)
        errors.push({
          path: `$input.operations.${i}.responseBody`,
          expected:
            "Response body with I{RoleName(PascalCase)}.IAuthorized type is required",
          value: op.responseBody,
          description: StringUtil.trim`
            Response body is required for authentication operations.

            The responseBody must contain description and typeName fields.
            typeName must be I{Prefix(PascalCase)}{RoleName(PascalCase)}.IAuthorized
            description must be a detailed description of the response body.
          `,
        });
      else if (!op.responseBody.typeName.endsWith(".IAuthorized"))
        errors.push({
          path: `$input.operations.${i}.responseBody.typeName`,
          expected: `Type name must be I{RoleName(PascalCase)}.IAuthorized`,
          value: op.responseBody?.typeName,
          description: StringUtil.trim`
            Wrong response body type name: ${op.responseBody?.typeName}

            For authentication operations (login, join, refresh), the response body type name must follow the convention "I{RoleName}.IAuthorized".

            This standardized naming convention ensures consistency across all authentication endpoints and clearly identifies authorization response types.
            The actor name should be in PascalCase format (e.g., IUser.IAuthorized, IAdmin.IAuthorized, ISeller.IAuthorized).
          `,
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
      if (props.actor.kind === "guest" && type === "login") continue;
      else if (authorizationTypes.has(type) === false)
        errors.push({
          path: "$input.operations[].authorizationType",
          expected: StringUtil.trim`{
          ...(AutoBeOpenApi.IOperation data),
          authorizationType: "${type}"
        }`,
          value: `No authorizationType "${type}" found in any operation`,
          description: StringUtil.trim`
          There must be an operation that has defined AutoBeOpenApi.IOperation.authorizationType := "${type}"
          for the "${props.actor}" role's authorization activity; "${type}".

          However, none of the operations have the AutoBeOpenApi.IOperation.authorizationType := "${type}"
          value, so that the "${props.actor}" cannot perform the authorization ${type} activity.

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
    props.model === "chatgpt"
      ? "chatgpt"
      : props.model === "gemini"
        ? "gemini"
        : "claude"
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
  gemini: (validate: Validator) =>
    typia.llm.application<IAutoBeInterfaceAuthorizationsApplication, "gemini">({
      validate: {
        makeOperations: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeInterfaceAuthorizationsApplication.IProps>;
