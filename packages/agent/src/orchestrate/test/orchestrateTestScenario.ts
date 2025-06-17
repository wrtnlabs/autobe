import { IAgenticaController, MicroAgentica } from "@agentica/core";
import { AutoBeOpenApi, AutoBeTest } from "@autobe/interface";
import { AutoBeTestScenarioEvent } from "@autobe/interface/src/events/AutoBeTestScenarioEvent";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { HashMap, HashSet, IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { divideArray } from "../../utils/divideArray";
import { enforceToolCall } from "../../utils/enforceToolCall";
import { OpenApiEndpointComparator } from "../interface/OpenApiEndpointComparator";
import { transformTestScenarioHistories } from "./transformTestScenarioHistories";

export async function orchestrateTestScenario<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  capacity: number = 4,
): Promise<AutoBeTestScenarioEvent> {
  const files = Object.entries(ctx.state().interface?.files ?? {})
    .filter(([filename]) => {
      return filename.startsWith("test/features/api/");
    })
    .reduce<Record<string, string>>((acc, [filename, content]) => {
      return Object.assign(acc, { [filename]: content });
    }, {});

  const operations = ctx.state().interface?.document.operations ?? [];
  const endpoints: Omit<AutoBeOpenApi.IOperation, "specification">[] =
    operations.map((it) => {
      return {
        method: it.method,
        path: it.path,
        summary: it.summary,
        description: it.description,
        parameters: it.parameters,
        requestBody: it.requestBody,
        responseBody: it.responseBody,
      };
    });

  const matrix: AutoBeOpenApi.IEndpoint[][] = divideArray({
    array: endpoints,
    capacity,
  });
  const start: Date = new Date();

  let completed: number = 0;

  const scenarios: AutoBeTest.IScenario[][] = await Promise.all(
    matrix.map(async (e) => {
      const rows: AutoBeTest.IScenario[] = await divideAndConquer(
        ctx,
        e,
        endpoints,
        files,
        3,
        (count) => {
          completed += count;
        },
      );
      ctx.dispatch({
        type: "testScenario",
        scenarios: rows,
        total: rows.flatMap((el) => el.scenarios).length,
        step: ctx.state().test?.step ?? 0,
        completed,
        created_at: start.toISOString(),
      });
      return rows;
    }),
  );

  return {
    type: "testScenario",
    scenarios: scenarios.flat(),
    total: scenarios.flat().flatMap((el) => el.scenarios).length,
    step: ctx.state().test?.step ?? 0,
    completed,
    created_at: start.toISOString(),
  };
}

async function divideAndConquer<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  endpoints: AutoBeOpenApi.IEndpoint[],
  allEndpoints: AutoBeOpenApi.IEndpoint[],
  files: Record<string, string>,
  retry: number,
  progress: (completed: number) => void,
): Promise<AutoBeTest.IScenario[]> {
  const remained: HashSet<AutoBeOpenApi.IEndpoint> = new HashSet(
    endpoints,
    OpenApiEndpointComparator.hashCode,
    OpenApiEndpointComparator.equals,
  );
  const scenarios: HashMap<AutoBeOpenApi.IEndpoint, AutoBeTest.Scenario[]> =
    new HashMap(
      OpenApiEndpointComparator.hashCode,
      OpenApiEndpointComparator.equals,
    );
  for (let i: number = 0; i < retry; ++i) {
    if (remained.empty() === true || scenarios.size() >= endpoints.length)
      break;
    const before: number = scenarios.size();
    const newbie: AutoBeTest.IScenario[] = await process(
      ctx,
      Array.from(remained),
      allEndpoints,
      files,
    );
    for (const item of newbie) {
      scenarios.set(item.endpoint, item.scenarios);
      remained.erase(item.endpoint);
    }
    if (scenarios.size() - before !== 0) progress(scenarios.size() - before);
  }
  return Array.from(scenarios.toJSON()).map((it) => ({
    endpoint: it.first,
    scenarios: it.second,
  }));
}

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  endpoints: AutoBeOpenApi.IEndpoint[],
  allEndpoints: AutoBeOpenApi.IEndpoint[],
  files: Record<string, string>,
): Promise<AutoBeTest.IScenario[]> {
  const pointer: IPointer<AutoBeTest.IScenario[] | null> = {
    value: null,
  };

  const agentica = new MicroAgentica({
    model: ctx.model,
    vendor: ctx.vendor,
    config: {
      ...(ctx.config ?? { locale: "en-US" }),
      systemPrompt: {
        describe: () => {
          return "Answer only 'completion' or 'failure'.";
        },
      },
    },
    tokenUsage: ctx.usage(),
    histories: [
      ...transformTestScenarioHistories(ctx.state(), allEndpoints, files),
    ],
    controllers: [
      createApplication({
        model: ctx.model,
        build: (next) => {
          pointer.value ??= [];
          pointer.value.push(...next.scenarios);
        },
      }),
    ],
  });
  enforceToolCall(agentica);

  await agentica.conversate(
    [
      "Make User Scenarios for below endpoints:",
      "",
      "```json",
      JSON.stringify(endpoints, null, 2),
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
