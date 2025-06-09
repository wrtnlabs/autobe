import { IAgenticaController, MicroAgentica } from "@agentica/core";
import { AutoBeOpenApi, AutoBeTest } from "@autobe/interface";
import { AutoBeTestScenarioEvent } from "@autobe/interface/src/events/AutoBeTestScenarioEvent";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { HashMap, HashSet, IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { divideArray } from "../../utils/divideArray";
import { OpenApiEndpointComparator } from "../interface/OpenApiEndpointComparator";
import { transformTestScenarioHistories } from "./transformTestScenarioHistories";

export async function orchestrateTestScenario<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  endpoints: AutoBeOpenApi.IEndpoint[],
  capacity: number = 12,
): Promise<AutoBeTestScenarioEvent> {
  const matrix: AutoBeOpenApi.IEndpoint[][] = divideArray({
    array: endpoints,
    capacity,
  });
  const start: Date = new Date();

  let completed: number = 0;

  const scenarios: AutoBeTest.IScenario[][] = await Promise.all(
    matrix.map(async (it) => {
      const row: AutoBeTest.IScenario[] = await divideAndConquer(
        ctx,
        it,
        3,
        (count) => {
          completed += count;
        },
      );
      ctx.dispatch({
        type: "testScenario",
        scenarios: row,
        total: endpoints.length,
        step: ctx.state().analyze?.step ?? 0,
        completed,
        created_at: start.toISOString(),
      });
      return row;
    }),
  );

  return {
    type: "testScenario",
    scenarios: scenarios.flat(),
    total: endpoints.length,
    step: ctx.state().analyze?.step ?? 0,
    completed,
    created_at: start.toISOString(),
  };
}

async function divideAndConquer<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  endpoints: AutoBeOpenApi.IEndpoint[],
  retry: number,
  progress: (completed: number) => void,
): Promise<AutoBeTest.IScenario[]> {
  const remained: HashSet<AutoBeOpenApi.IEndpoint> = new HashSet(
    endpoints,
    OpenApiEndpointComparator.hashCode,
    OpenApiEndpointComparator.equals,
  );
  const senarios: HashMap<AutoBeOpenApi.IEndpoint, AutoBeTest.IScenario> =
    new HashMap(
      OpenApiEndpointComparator.hashCode,
      OpenApiEndpointComparator.equals,
    );
  for (let i: number = 0; i < retry; ++i) {
    if (remained.empty() === true || senarios.size() >= endpoints.length) break;
    const before: number = senarios.size();
    const newbie: AutoBeTest.IScenario[] = await process(
      ctx,
      Array.from(remained),
    );
    for (const item of newbie) {
      senarios.set(item.endpoint, item);
      remained.erase(item.endpoint);
    }
    if (senarios.size() - before !== 0) progress(senarios.size() - before);
  }
  return senarios.toJSON().map((it) => it.second);
}

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  endpoints: AutoBeOpenApi.IEndpoint[],
): Promise<AutoBeTest.IScenario[]> {
  const pointer: IPointer<AutoBeTest.IScenario[] | null> = {
    value: null,
  };

  const agentica = new MicroAgentica({
    model: ctx.model,
    vendor: ctx.vendor,
    config: {
      ...(ctx.config ?? {}),
    },
    histories: transformTestScenarioHistories(ctx.state()),
    controllers: [
      createApplication({
        model: ctx.model,
        build: (next) => {
          pointer.value = next.scenarios;
        },
      }),
    ],
  });

  agentica.on("request", async (event) => {
    if (event.body.tools) event.body.tool_choice = "required";
  });

  await agentica.conversate(
    [
      "Make User Scenarios for below endpoints:",
      "",
      "```json",
      JSON.stringify(Array.from(endpoints), null, 2),
      "```",
    ].join("\n"),
  );

  if (pointer.value === null) throw new Error("Failed to make scenarios.");
  return pointer.value;
}

function createApplication<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (next: IMakeScenarioProps) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const application: ILlmApplication<Model> = collection[
    props.model
  ] as unknown as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: "Make User Scenarios",
    application,
    execute: {
      makeScenario: (next) => {
        props.build(next);
      },
    } satisfies IApplication,
  };
}

const claude = typia.llm.application<
  IApplication,
  "claude",
  {
    reference: true;
  }
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
   * Make user scenarios for the given endpoints.
   *
   * @param props Properties containing the endpoints and user scenarios.
   */
  makeScenario(props: IMakeScenarioProps): void;
}

interface IMakeScenarioProps {
  /** Array of user scenarios. */
  scenarios: AutoBeTest.IScenario[];
}
