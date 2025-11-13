import { IAgenticaController } from "@agentica/core";
import {
  AutoBeAnalyzeActor,
  AutoBeEventSource,
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
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformInterfaceAuthorizationHistory } from "./histories/transformInterfaceAuthorizationHistory";
import { IAutoBeInterfaceAuthorizationsApplication } from "./structures/IAutoBeInterfaceAuthorizationsApplication";

export async function orchestrateInterfaceAuthorization<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  props: {
    instruction: string;
  },
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
          instruction: props.instruction,
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
  const preliminary: AutoBePreliminaryController<
    "analysisFiles" | "prismaSchemas"
  > = new AutoBePreliminaryController({
    application:
      typia.json.application<IAutoBeInterfaceAuthorizationsApplication>(),
    source: SOURCE,
    kinds: ["analysisFiles", "prismaSchemas"],
    state: ctx.state(),
  });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeInterfaceAuthorizationsApplication.IComplete | null> =
      {
        value: null,
      };
    const result: AutoBeContext.IResult<Model> = await ctx.conversate({
      source: SOURCE,
      controller: createController({
        model: ctx.model,
        actor: props.actor,
        build: (next) => {
          pointer.value = next;
        },
        preliminary,
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...transformInterfaceAuthorizationHistory({
        state: ctx.state(),
        instruction: props.instruction,
        actor: props.actor,
        preliminary,
      }),
    });
    return out(result)(
      pointer.value !== null
        ? ({
            type: SOURCE,
            id: v7(),
            operations: pointer.value.operations,
            completed: ++props.progress.completed,
            metric: result.metric,
            tokenUsage: result.tokenUsage,
            created_at: new Date().toISOString(),
            step: ctx.state().analyze?.step ?? 0,
            total: props.progress.total,
          } satisfies AutoBeInterfaceAuthorizationEvent)
        : null,
    );
  });
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  actor: AutoBeAnalyzeActor;
  preliminary: AutoBePreliminaryController<"analysisFiles" | "prismaSchemas">;
  build: (next: IAutoBeInterfaceAuthorizationsApplication.IComplete) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const validate = (
    next: unknown,
  ): IValidation<IAutoBeInterfaceAuthorizationsApplication.IProps> => {
    const result: IValidation<IAutoBeInterfaceAuthorizationsApplication.IProps> =
      typia.validate<IAutoBeInterfaceAuthorizationsApplication.IProps>(next);
    if (result.success === false) return result;
    else if (result.data.request.type !== "complete")
      return props.preliminary.validate({
        request: result.data.request,
      });
    // remove login operation for guest role
    else if (props.actor.kind === "guest") {
      result.data.request.operations = result.data.request.operations.filter(
        (op) => op.authorizationType !== "login",
      );
    }

    const errors: IValidation.IError[] = [];
    result.data.request.operations.forEach((op, i) => {
      // validate authorizationActor
      if (op.authorizationActor !== null) {
        op.authorizationActor = props.actor.name;
      }

      // validate responseBody.typeName -> must be ~.IAuthorized
      if (op.authorizationType === null) return;
      else if (op.responseBody === null)
        errors.push({
          path: `$input.request.operations.${i}.responseBody`,
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
          path: `$input.request.operations.${i}.responseBody.typeName`,
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
      result.data.request.operations
        .map((o) => o.authorizationType)
        .filter((v) => v !== null),
    );
    for (const type of typia.misc.literals<AuthorizationType>())
      if (props.actor.kind === "guest" && type === "login") continue;
      else if (authorizationTypes.has(type) === false)
        errors.push({
          path: "$input.request.operations[].authorizationType",
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
    name: SOURCE,
    application,
    execute: {
      process: (next) => {
        if (next.request.type === "complete") props.build(next.request);
      },
    } satisfies IAutoBeInterfaceAuthorizationsApplication,
  };
}

const collection = {
  chatgpt: (validator: Validator) =>
    typia.llm.application<IAutoBeInterfaceAuthorizationsApplication, "chatgpt">(
      {
        validate: {
          process: validator,
        },
      },
    ),
  claude: (validator: Validator) =>
    typia.llm.application<IAutoBeInterfaceAuthorizationsApplication, "claude">({
      validate: {
        process: validator,
      },
    }),
  gemini: (validator: Validator) =>
    typia.llm.application<IAutoBeInterfaceAuthorizationsApplication, "gemini">({
      validate: {
        process: validator,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeInterfaceAuthorizationsApplication.IProps>;

const SOURCE = "interfaceAuthorization" satisfies AutoBeEventSource;
