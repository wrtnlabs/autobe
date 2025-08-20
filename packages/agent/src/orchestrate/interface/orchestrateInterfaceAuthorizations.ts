import { IAgenticaController } from "@agentica/core";
import {
  AutoBeAnalyzeRole,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { AutoBeInterfaceAuthorizationEvent } from "@autobe/interface/src/events/AutoBeInterfaceAuthorizationEvent";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { transformInterfaceAuthorizationsHistories } from "./histories/transformInterfaceAuthorizationsHistories";
import { IAutoBeInterfaceAuthorizationsApplication } from "./structures/IAutoBeInterfaceAuthorizationsApplication";

export async function orchestrateInterfaceAuthorizations<
  Model extends ILlmSchema.Model,
>(ctx: AutoBeContext<Model>): Promise<AutoBeOpenApi.IOperation[]> {
  const roles: AutoBeAnalyzeRole[] = ctx.state().analyze?.roles ?? [];
  const progress: AutoBeProgressEventBase = {
    total: roles.length,
    completed: 0,
  };
  const operations: AutoBeOpenApi.IOperation[][] = await Promise.all(
    roles.map(async (role) => {
      const event: AutoBeInterfaceAuthorizationEvent = await process(
        ctx,
        role,
        progress,
      );
      ctx.dispatch(event);
      return event.operations;
    }),
  );

  return operations.flat();
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
      roles: ctx.state().analyze?.roles.map((it) => it.name) ?? [],
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
  roles: string[];
  build: (next: IAutoBeInterfaceAuthorizationsApplication.IProps) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const validate = (
    next: unknown,
  ): IValidation<IAutoBeInterfaceAuthorizationsApplication.IProps> => {
    const result: IValidation<IAutoBeInterfaceAuthorizationsApplication.IProps> =
      typia.validate<IAutoBeInterfaceAuthorizationsApplication.IProps>(next);
    if (result.success === false) return result;

    const authorization: IAutoBeInterfaceAuthorizationsApplication.IProps =
      result.data;

    const errors: IValidation.IError[] = [];

    authorization.operations.forEach((op, i) => {
      if (op.authorizationType === null) {
        return;
      }

      if (op.responseBody?.typeName.split(".").at(1) !== "IAuthorized") {
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
      }
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
