import {
  IAgenticaController,
  IAgenticaHistoryJson,
  MicroAgentica,
} from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { AutoBeTestScenarioEvent } from "@autobe/interface";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { divideArray } from "../../utils/divideArray";
import { enforceToolCall } from "../../utils/enforceToolCall";
import { IAutoBeTestScenarioApplication } from "./structures/IAutoBeTestScenarioApplication";

export async function orchestrateTestScenario<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
): Promise<AutoBeTestScenarioEvent> {
  const operations = ctx.state().interface?.document.operations ?? [];
  if (operations.length === 0) {
    throw new Error(
      "Cannot write test scenarios because these are no operations.",
    );
  }

  const exclude: IAutoBeTestScenarioApplication.IScenarioGroup[] = [];
  let include: AutoBeOpenApi.IOperation[] = Array.from(operations);

  do {
    const matrix = divideArray({ array: include, capacity: 30 });

    await Promise.all(
      matrix.map(async (_include) => {
        exclude.push(
          ...(await execute(
            ctx,
            operations,
            _include,
            exclude.map((x) => x.endpoint),
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
          dependencies: plan.dependsOn,
        } satisfies AutoBeTestScenarioEvent.IScenario;
      });
    }),
    created_at: new Date().toISOString(),
  } as AutoBeTestScenarioEvent;
}

const execute = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  ops: AutoBeOpenApi.IOperation[],
  include: Pick<AutoBeOpenApi.IOperation, "method" | "path">[],
  exclude: Pick<AutoBeOpenApi.IOperation, "method" | "path">[],
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
    tokenUsage: ctx.usage(),
    histories: createHistoryProperties(ops, include, exclude),
    controllers: [
      createApplication({
        model: ctx.model,
        build: (next) => {
          pointer.value ??= [];
          pointer.value.push(...next.scenarioGroups);
        },
      }),
    ],
  });
  enforceToolCall(agentica);

  await agentica.conversate(`create test scenarios.`);
  if (pointer.value.length === 0) {
    throw new Error("Failed to create test plans.");
  }

  return pointer.value;
};

const createHistoryProperties = (
  operations: AutoBeOpenApi.IOperation[],
  include: Pick<AutoBeOpenApi.IOperation, "method" | "path">[],
  exclude: Pick<AutoBeOpenApi.IOperation, "method" | "path">[],
) => [
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
      "Below are the full operations. Please refer to this.",
      "Your role is to draft all test cases for each given Operation.",
      "It is also permissible to write multiple test codes on a single endpoint.",
      "However, rather than meaningless tests, business logic tests should be written and an E2E test situation should be assumed.",
      "",
      "```json",
      JSON.stringify(
        operations.map((el) => ({
          path: el.path,
          method: el.method,
          summary: el.summary,
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

    const errors: IValidation.IError[] = [];
    result.data.scenarioGroups.forEach((pg, i, arr) => {
      arr.forEach((target, j) => {
        if (
          i !== j &&
          target.endpoint.method === pg.endpoint.method &&
          target.endpoint.path === pg.endpoint.path
        ) {
          if (
            !errors.some(
              (el) =>
                el.path !== `planGroups[${j}].path` &&
                el.value !== target.endpoint.path,
            )
          ) {
            errors.push({
              path: `planGroups[${j}].path`,
              expected: `planGroup's {method + path} cannot duplicated.`,
              value: target.endpoint.path,
            });
          }

          if (
            !errors.some(
              (el) =>
                el.path !== `planGroups[${j}].method` &&
                el.value !== target.endpoint.method,
            )
          ) {
            errors.push({
              path: `planGroups[${j}].method`,
              expected: `planGroup's {method + path} cannot duplicated.`,
              value: target.endpoint.method,
            });
          }
        }
      });
    });

    if (errors.length !== 0) {
      console.log(JSON.stringify(errors, null, 2), "errors");
      return {
        success: false,
        errors,
        data: next,
      };
    }

    return result;
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
  "3.0": typia.llm.application<IAutoBeTestScenarioApplication, "3.0">(),
};
