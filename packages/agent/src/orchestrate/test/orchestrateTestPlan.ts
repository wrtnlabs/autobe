import {
  IAgenticaController,
  IAgenticaHistoryJson,
  MicroAgentica,
} from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { AutoBeTestPlanEvent } from "@autobe/interface/src/events/AutoBeTestPlanEvent";
import { IAutoBeTestPlan } from "@autobe/interface/src/test/AutoBeTestPlan";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { divideArray } from "../../utils/divideArray";
import { enforceToolCall } from "../../utils/enforceToolCall";

export async function orchestrateTestPlan<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
): Promise<AutoBeTestPlanEvent> {
  const operations = ctx.state().interface?.document.operations ?? [];
  if (operations.length === 0) {
    throw new Error(
      "Cannot write test scenarios because these are no operations.",
    );
  }

  const exclude: IAutoBeTestPlan.IPlanGroup[] = [];
  let include: AutoBeOpenApi.IOperation[] = Array.from(operations);

  do {
    const matrix = divideArray({ array: include, capacity: 30 });

    await Promise.all(
      matrix.map(async (_include) => {
        exclude.push(...(await execute(ctx, operations, _include, exclude)));
      }),
    );

    include = include.filter((op) => {
      if (
        exclude.some((pg) => pg.method === op.method && pg.path === op.path)
      ) {
        return false;
      }
      return true;
    });
  } while (include.length > 0);

  return {
    type: "testPlan",
    step: ctx.state().analyze?.step ?? 0,
    plans: exclude.flatMap((pg) => {
      return pg.plans.map((plan) => {
        return {
          method: pg.method,
          path: pg.path,
          draft: plan.draft,
          functionName: plan.functionName,
          dependsOn: plan.dependsOn,
        };
      });
    }),
    created_at: new Date().toISOString(),
  } as AutoBeTestPlanEvent;
}

const execute = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  ops: AutoBeOpenApi.IOperation[],
  include: Pick<AutoBeOpenApi.IOperation, "method" | "path">[],
  exclude: Pick<AutoBeOpenApi.IOperation, "method" | "path">[],
) => {
  const pointer: IPointer<IAutoBeTestPlan.IPlanGroup[]> = {
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
          pointer.value.push(...next.planGroups);
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
    text: AutoBeSystemPromptConstant.TEST_PLAN,
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
  build: (next: IMakePlanProps) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const application: ILlmApplication<Model> = collection[
    props.model
  ] as unknown as ILlmApplication<Model>;

  application.functions[0].validate = (next: unknown): IValidation => {
    const result: IValidation<IMakePlanProps> =
      typia.validate<IMakePlanProps>(next);
    if (result.success === false) return result;

    const errors: IValidation.IError[] = [];
    result.data.planGroups.forEach((pg, i, arr) => {
      arr.forEach((target, j) => {
        if (i !== j && target.method === pg.method && target.path === pg.path) {
          if (
            !errors.some(
              (el) =>
                el.path !== `planGroups[${j}].path` && el.value !== target.path,
            )
          ) {
            errors.push({
              path: `planGroups[${j}].path`,
              expected: `planGroup's {method + path} cannot duplicated.`,
              value: target.path,
            });
          }

          if (
            !errors.some(
              (el) =>
                el.path !== `planGroups[${j}].method` &&
                el.value !== target.method,
            )
          ) {
            errors.push({
              path: `planGroups[${j}].method`,
              expected: `planGroup's {method + path} cannot duplicated.`,
              value: target.method,
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
      makePlan: (next) => {
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
   * Make test plans for the given endpoints.
   *
   * @param props Properties containing the endpoints and test plans.
   */
  makePlan(props: IMakePlanProps): void;
}

interface IMakePlanProps {
  /** Array of test plan group. */
  planGroups: IAutoBeTestPlan.IPlanGroup[];
}
