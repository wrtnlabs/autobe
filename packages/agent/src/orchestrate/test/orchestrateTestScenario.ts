import {
  IAgenticaController,
  IAgenticaHistoryJson,
  MicroAgentica,
} from "@agentica/core";
import {
  AutoBeOpenApi,
  AutoBeTestScenario,
  AutoBeTestScenarioEvent,
} from "@autobe/interface";
import { AutoBeEndpointComparator } from "@autobe/utils";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { HashMap, IPointer, Pair } from "tstl";
import typia from "typia";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { divideArray } from "../../utils/divideArray";
import { enforceToolCall } from "../../utils/enforceToolCall";
import { forceRetry } from "../../utils/forceRetry";
import { IAutoBeTestScenarioApplication } from "./structures/IAutoBeTestScenarioApplication";

export async function orchestrateTestScenario<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
): Promise<AutoBeTestScenarioEvent> {
  const operations: AutoBeOpenApi.IOperation[] =
    ctx.state().interface?.document.operations ?? [];
  if (operations.length === 0) {
    throw new Error(
      "Cannot write test scenarios because these are no operations.",
    );
  }

  const dict: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation> =
    new HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation>(
      operations.map(
        (op) =>
          new Pair(
            {
              path: op.path,
              method: op.method,
            },
            op,
          ),
      ),
      AutoBeEndpointComparator.hashCode,
      AutoBeEndpointComparator.equals,
    );
  const endpointNotFound: string = [
    `You have to select one of the endpoints below`,
    "",
    " method | path ",
    "--------|------",
    ...operations.map((op) => `\`${op.method}\` | \`${op.path}\``).join("\n"),
  ].join("\n");

  const exclude: IAutoBeTestScenarioApplication.IScenarioGroup[] = [];
  let include: AutoBeOpenApi.IOperation[] = Array.from(operations);

  do {
    const matrix: AutoBeOpenApi.IOperation[][] = divideArray({
      array: include,
      capacity: 5,
    });
    await Promise.all(
      matrix.map(async (include) => {
        exclude.push(
          ...(await forceRetry(() =>
            execute(
              ctx,
              dict,
              endpointNotFound,
              operations,
              include,
              exclude.map((x) => x.endpoint),
            ),
          )),
        );
      }),
    );
    include = include.filter((op) => {
      if (
        exclude.some(
          (pg) =>
            pg.endpoint.method === op.method && pg.endpoint.path === op.path,
        )
      ) {
        return false;
      }
      return true;
    });
  } while (include.length > 0);

  return {
    type: "testScenario",
    step: ctx.state().analyze?.step ?? 0,
    scenarios: exclude.flatMap((pg) => {
      return pg.scenarios.map((plan) => {
        return {
          endpoint: pg.endpoint,
          draft: plan.draft,
          functionName: plan.functionName,
          dependencies: plan.dependencies,
        } satisfies AutoBeTestScenario;
      });
    }),
    created_at: new Date().toISOString(),
  } as AutoBeTestScenarioEvent;
}

const execute = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  dict: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation>,
  endpointNotFound: string,
  entire: AutoBeOpenApi.IOperation[],
  include: AutoBeOpenApi.IEndpoint[],
  exclude: AutoBeOpenApi.IEndpoint[],
) => {
  const pointer: IPointer<IAutoBeTestScenarioApplication.IScenarioGroup[]> = {
    value: [],
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
    histories: createHistoryProperties(entire, include, exclude),
    controllers: [
      createApplication({
        model: ctx.model,
        endpointNotFound,
        dict,
        build: (next) => {
          pointer.value ??= [];
          pointer.value.push(...next.scenarioGroups);
        },
      }),
    ],
  });
  enforceToolCall(agentica);

  await agentica.conversate(`create test scenarios.`).finally(() => {
    const tokenUsage = agentica.getTokenUsage();
    ctx.usage().record(tokenUsage, ["test"]);
  });
  if (pointer.value.length === 0) {
    throw new Error("Failed to create test plans.");
  }

  return pointer.value;
};

const createHistoryProperties = (
  entire: AutoBeOpenApi.IOperation[],
  include: Pick<AutoBeOpenApi.IOperation, "method" | "path">[],
  exclude: Pick<AutoBeOpenApi.IOperation, "method" | "path">[],
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => [
  {
    id: v4(),
    created_at: new Date().toISOString(),
    type: "systemMessage",
    text: AutoBeSystemPromptConstant.TEST_SCENARIO,
  } satisfies IAgenticaHistoryJson.ISystemMessage,
  {
    id: v4(),
    created_at: new Date().toISOString(),
    type: "systemMessage",
    text: [
      "# Operations",
      "Below are the full operations. Please refer to this.",
      "Your role is to draft all test cases for each given Operation.",
      "It is also permissible to write multiple test codes on a single endpoint.",
      "However, rather than meaningless tests, business logic tests should be written and an E2E test situation should be assumed.",
      "",
      "Please carefully analyze each operation to identify all dependencies required for testing.",
      "For example, if you want to test liking and then deleting a post,",
      "you might think to test post creation, liking, and unlike operations.",
      "However, even if not explicitly mentioned, user registration and login are essential prerequisites.",
      "Pay close attention to IDs and related values in the API,",
      "and ensure you identify all dependencies between endpoints.",
      "",
      "```json",
      JSON.stringify(
        entire.map((el) => ({
          ...el,
          specification: undefined,
        })),
      ),
      "```",
    ].join("\n"),
  } satisfies IAgenticaHistoryJson.ISystemMessage,
  {
    id: v4(),
    created_at: new Date().toISOString(),
    type: "systemMessage",
    text: [
      "# Included in Test Plan",
      include
        .map((el) => `- ${el.method.toUpperCase()}: ${el.path}`)
        .join("\n"),
      "",
      "# Excluded from Test Plan",
      "These are the endpoints that have already been used in test codes generated as part of a plan group.",
      "These endpoints do not need to be tested again.",
      "However, it is allowed to reference or depend on these endpoints when writing test codes for other purposes.",
      exclude
        .map((el) => `- ${el.method.toUpperCase()}: ${el.path}`)
        .join("\n"),
    ].join("\n"),
  } satisfies IAgenticaHistoryJson.ISystemMessage,
];

function createApplication<Model extends ILlmSchema.Model>(props: {
  model: Model;
  endpointNotFound: string;
  dict: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation>;
  build: (next: IAutoBeTestScenarioApplication.IProps) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const application: ILlmApplication<Model> = collection[
    props.model
  ] as unknown as ILlmApplication<Model>;

  application.functions[0].validate = (next: unknown): IValidation => {
    const result: IValidation<IAutoBeTestScenarioApplication.IProps> =
      typia.validate<IAutoBeTestScenarioApplication.IProps>(next);
    if (result.success === false) return result;

    // merge to unique scenario groups
    const scenarioGroups: IAutoBeTestScenarioApplication.IScenarioGroup[] = [];
    result.data.scenarioGroups.forEach((sg) => {
      const created = scenarioGroups.find(
        (el) =>
          el.endpoint.method === sg.endpoint.method &&
          el.endpoint.path === sg.endpoint.path,
      );
      if (created) {
        created.scenarios.push(...sg.scenarios);
      } else {
        scenarioGroups.push(sg);
      }
    });

    // validate endpoints
    const errors: IValidation.IError[] = [];
    scenarioGroups.forEach((group, i) => {
      if (props.dict.has(group.endpoint) === false)
        errors.push({
          value: group.endpoint,
          path: `$input.scenarioGroups[${i}].endpoint`,
          expected: "AutoBeOpenApi.IEndpoint",
          description: props.endpointNotFound,
        });
      group.scenarios.forEach((s, j) => {
        s.dependencies.forEach((dep, k) => {
          if (props.dict.has(dep.endpoint) === false)
            errors.push({
              value: dep.endpoint,
              path: `$input.scenarioGroups[${i}].scenarios[${j}].dependencies[${k}].endpoint`,
              expected: "AutoBeOpenApi.IEndpoint",
              description: props.endpointNotFound,
            });
        });
      });
    });
    return errors.length === 0
      ? {
          success: true,
          data: scenarioGroups,
        }
      : {
          success: false,
          data: scenarioGroups,
          errors,
        };
  };
  return {
    protocol: "class",
    name: "Make test plans",
    application,
    execute: {
      makeScenario: (next) => {
        props.build(next);
      },
    } satisfies IAutoBeTestScenarioApplication,
  };
}

const claude = typia.llm.application<
  IAutoBeTestScenarioApplication,
  "claude",
  {
    reference: true;
  }
>();
const collection = {
  chatgpt: typia.llm.application<
    IAutoBeTestScenarioApplication,
    "chatgpt",
    { reference: true }
  >(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};
