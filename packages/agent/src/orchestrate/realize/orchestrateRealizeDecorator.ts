import { IAgenticaController, MicroAgentica } from "@agentica/core";
import { AutoBeRealizeDecoratorEvent } from "@autobe/interface";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { enforceToolCall } from "../../utils/enforceToolCall";
import { IAutoBeRealizeDecoratorApplication } from "./structures/IAutoBeRealizeDecoratorApplication";
import { transformRealizeDecoratorHistories } from "./transformRealizeDecorator";

/**
 * 1. Create decorator and its parameters. and design the Authorization Provider.
 * 2. According to Authorization Provider design, create the Provider.
 *
 * @param ctx
 */
export async function orchestrateRealizeDecorator<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
): Promise<IAutoBeRealizeDecoratorApplication.IProps[]> {
  const compiled = ctx.state().prisma?.compiled;

  const prismaClients: Record<string, string> =
    compiled?.type === "success" ? compiled.nodeModules : {};

  const roles = Array.from(
    new Set(
      ctx
        .state()
        .interface?.document.operations.map(
          (operation) => operation.authorization?.role,
        )
        .flat()
        .filter((role) => role !== undefined),
    ),
  );

  const result: Record<string, string> = {};
  const decorators: IAutoBeRealizeDecoratorApplication.IProps[] = [];

  for (const role of roles) {
    const decorator: IAutoBeRealizeDecoratorApplication.IProps = await process(
      ctx,
      role,
      prismaClients,
    );

    result[`src/decorators/${decorator.decorator.name}.ts`] =
      decorator.decorator.code;
    result[`src/authentications/${decorator.provider.name}.ts`] =
      decorator.provider.code;

    decorators.push(decorator);
  }

  const events: AutoBeRealizeDecoratorEvent = {
    type: "realizeDecorator",
    created_at: new Date().toISOString(),
    files: result,
  };

  ctx.dispatch(events);

  return decorators;
}

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  role: string,
  prismaClients: Record<string, string>,
): Promise<IAutoBeRealizeDecoratorApplication.IProps> {
  const pointer: IPointer<IAutoBeRealizeDecoratorApplication.IProps | null> = {
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
    histories: transformRealizeDecoratorHistories(role, prismaClients),
    controllers: [
      createApplication({
        model: ctx.model,
        build: (next) => {
          pointer.value = next;
        },
      }),
    ],
  });

  enforceToolCall(agentica);

  await agentica
    .conversate("Create Authorization Provider and Decorator.")
    .finally(() => {
      const tokenUsage = agentica.getTokenUsage();
      ctx.usage().record(tokenUsage, ["realize"]);
    });

  if (pointer.value === null) throw new Error("Failed to create decorator.");

  return pointer.value;
}

function createApplication<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (next: IAutoBeRealizeDecoratorApplication.IProps) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const application: ILlmApplication<Model> = collection[
    props.model
  ] as unknown as ILlmApplication<Model>;

  return {
    protocol: "class",
    name: "Create Decorator",
    application,
    execute: {
      createDecorator: (next) => {
        props.build(next);
      },
    } satisfies IAutoBeRealizeDecoratorApplication,
  };
}

const claude = typia.llm.application<
  IAutoBeRealizeDecoratorApplication,
  "claude",
  {
    reference: true;
  }
>();
const collection = {
  chatgpt: typia.llm.application<
    IAutoBeRealizeDecoratorApplication,
    "chatgpt",
    { reference: true }
  >(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};

// interface IAutoBeRealizeDecoratorApplication.IProps {
//   /**
//    * The name of the authentication Provider function in {role}Authorize format
//    * (e.g., adminAuthorize, userAuthorize). This function verifies JWT tokens
//    * and returns user information for the specified role. It should handle JWT
//    * validation, role verification, and database queries to ensure the user
//    * exists and has proper permissions.
//    */
//   providerFunctionName: string;

//   /**
//    * The name of the Payload type in {Role}Payload format (e.g., AdminPayload,
//    * UserPayload). This interface defines the structure of the authenticated
//    * user data that will be used as the parameter type when using decorators in
//    * Controllers. Must include 'id' (UUID format) and 'type' (role
//    * discriminator) fields.
//    */
//   decoratorTypeName: string;

//   /**
//    * Complete TypeScript code for the authentication Provider function and its
//    * corresponding Payload interface. Must include: JWT token verification using
//    * jwtAuthorize function, role type checking, database query using
//    * MyGlobal.prisma.{tableName} pattern, proper error handling with NestJS
//    * exceptions, and the Payload interface definition with appropriate typia
//    * tags for type safety.
//    */
//   provider: string;

//   /**
//    * The name of the Decorator to be generated in {Role}Auth format (e.g.,
//    * AdminAuth, UserAuth). This decorator will be used as a parameter decorator
//    * in Controller methods to automatically authenticate and authorize users for
//    * the specific role, injecting the authenticated user payload.
//    */
//   decoratorName: string;

//   /**
//    * Complete TypeScript code for the authentication Decorator implementation.
//    * Must include: SwaggerCustomizer integration for API documentation with
//    * bearer token security, createParamDecorator implementation for the actual
//    * authentication logic, Singleton pattern for efficient decorator instance
//    * management, and proper integration with the corresponding Provider
//    * function.
//    */
//   decorator: string;
// }
