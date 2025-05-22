import { IAgenticaController, MicroAgentica } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { HashSet, IPointer } from "tstl";
import typia from "typia";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { OpenApiEndpointComparator } from "./OpenApiEndpointComparator";
import { transformInterfaceHistories } from "./transformInterfaceHistories";

export async function orchestrateInterfaceEndpoints<
  Model extends ILlmSchema.Model,
>(ctx: AutoBeContext<Model>): Promise<AutoBeOpenApi.IEndpoint[]> {
  const pointer: IPointer<AutoBeOpenApi.IEndpoint[] | null> = {
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
      systemPrompt: {
        common: () => AutoBeSystemPromptConstant.INTERFACE_ENDPOINT,
      },
    },
    histories: transformInterfaceHistories(ctx.state()),
    tokenUsage: ctx.usage(),
    controllers: [
      createApplication({
        model: ctx.model,
        build: async (endpoints) => {
          pointer.value = endpoints;
        },
      }),
    ],
  });
  agentica.on("request", async (event) => {
    event.body.tool_choice = "required";
  });

  await agentica.conversate("Make API endpoints for the given assets.");
  if (pointer.value === null) throw new Error("Failed to create endpoints."); // never be happened
  return new HashSet(
    pointer.value,
    OpenApiEndpointComparator.hashCode,
    OpenApiEndpointComparator.equals,
  ).toJSON();
}

function createApplication<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (endpoints: AutoBeOpenApi.IEndpoint[]) => Promise<void>;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const application: ILlmApplication<Model> = collection[
    props.model
  ] as unknown as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: "interface",
    application,
    execute: {
      makeEndpoints: async (next) => {
        await props.build(next.endpoints);
        return {
          success: true,
        };
      },
    } satisfies IApplication,
  };
}

const claude = typia.llm.application<
  IApplication,
  "claude",
  { reference: true }
>();
const collection = {
  chatgpt: typia.llm.application<
    IApplication,
    "chatgpt",
    { reference: true }
  >(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
  "3.0": typia.llm.application<IApplication, "3.0">(),
};

interface IApplication {
  /**
   * Create Restful API endpoints.
   *
   * Create Restful API endpoints referencing the given documents; requirement
   * analysis documents, and Prisma schema files with ERD descriptions. The API
   * endpoints must cover every requirements and every entities in the ERD.
   *
   * Also, each combination of {@link AutoBeOpenApi.IEndpoint.path} and
   * {@link AutoBeOpenApi.IEndpoint.method} must be unique to avoid duplicates.
   * Please don't make any duplicates.
   *
   * @param props Properties containing the endpoints
   */
  makeEndpoints(props: {
    /** List of endpoints to generate. */
    endpoints: AutoBeOpenApi.IEndpoint[];
  }): void;
}
