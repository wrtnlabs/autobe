import {
  AgenticaAssistantMessageHistory,
  IAgenticaController,
  MicroAgentica,
  MicroAgenticaHistory,
} from "@agentica/core";
import {
  AutoBeAssistantMessageHistory,
  AutoBeInterfaceEndpointsEvent,
  AutoBeOpenApi,
} from "@autobe/interface";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { HashSet, IPointer } from "tstl";
import typia from "typia";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { OpenApiEndpointComparator } from "./OpenApiEndpointComparator";
import { transformInterfaceHistories } from "./transformInterfaceHistories";

export async function orchestrateInterfaceEndpoints<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  content: string = "Make API endpoints for the given assets.",
): Promise<AutoBeInterfaceEndpointsEvent | AutoBeAssistantMessageHistory> {
  const start: Date = new Date();
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
    },
    histories: transformInterfaceHistories(
      ctx.state(),
      AutoBeSystemPromptConstant.INTERFACE_ENDPOINT,
    ),
    controllers: [
      createApplication({
        model: ctx.model,
        build: (endpoints) => {
          pointer.value ??= endpoints;
          pointer.value.push(...endpoints);
        },
      }),
    ],
  });

  const histories: MicroAgenticaHistory<Model>[] = await agentica
    .conversate(content)
    .finally(() => {
      const tokenUsage = agentica.getTokenUsage();
      ctx.usage().record(tokenUsage, ["interface"]);
    });
  if (histories.at(-1)?.type === "assistantMessage")
    return {
      ...(histories.at(-1)! as AgenticaAssistantMessageHistory),
      created_at: start.toISOString(),
      completed_at: new Date().toISOString(),
      id: v4(),
    } satisfies AutoBeAssistantMessageHistory;
  else if (pointer.value === null)
    throw new Error("Failed to generate endpoints."); // unreachable
  return {
    type: "interfaceEndpoints",
    endpoints: new HashSet(
      pointer.value,
      OpenApiEndpointComparator.hashCode,
      OpenApiEndpointComparator.equals,
    ).toJSON(),
    created_at: start.toISOString(),
    step: ctx.state().analyze?.step ?? 0,
  } satisfies AutoBeInterfaceEndpointsEvent;
}

function createApplication<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (endpoints: AutoBeOpenApi.IEndpoint[]) => void;
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
      makeEndpoints: (next) => {
        props.build(next.endpoints);
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
