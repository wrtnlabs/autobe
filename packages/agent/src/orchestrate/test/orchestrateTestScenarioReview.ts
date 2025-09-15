import { IAgenticaController } from "@agentica/core";
import { AutoBeProgressEventBase, AutoBeTestScenario } from "@autobe/interface";
import { AutoBeEndpointComparator } from "@autobe/utils";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { HashMap, IPointer, Pair } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { transformTestScenarioReviewHistories } from "./histories/transformTestScenarioReviewHistories";
import { IAutoBeTestScenarioApplication } from "./structures/IAutoBeTestScenarioApplication";
import { IAutoBeTestScenarioReviewApplication } from "./structures/IAutoBeTestScenarioReviewApplication";

export async function orchestrateTestScenarioReview<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  groups: IAutoBeTestScenarioApplication.IScenarioGroup[],
  progress: AutoBeProgressEventBase,
): Promise<IAutoBeTestScenarioApplication.IScenarioGroup[]> {
  const res: IAutoBeTestScenarioApplication.IScenarioGroup[] = await review(
    ctx,
    groups,
    progress,
    ctx.retry,
  );

  console.log();
  console.log(`-------------Before vs After-------------`);
  console.log(`Before Length: ${groups.length}`);
  console.log(`After Group Length: ${res.length}\n`);

  groups.forEach((group) => {
    res.forEach((r) => {
      if (
        group.endpoint.method === r.endpoint.method &&
        group.endpoint.path === r.endpoint.path
      ) {
        console.log(`Group : ${group.endpoint.method} ${group.endpoint.path}`);
        console.log(`Before Scenario Length: ${group.scenarios.length}`);
        console.log(`After Scenario Length: ${r.scenarios.length}`);

        group.scenarios.forEach((s) => {
          r.scenarios.forEach((r) => {
            if (s.functionName === r.functionName) {
              console.log(`Scenario Name: ${s.functionName}`);

              console.log(
                `Before Dependencies: ${JSON.stringify(s.dependencies, null, 2)}`,
              );
              console.log(
                `After Dependencies: ${JSON.stringify(r.dependencies, null, 2)}`,
              );
            }
          });
        });
        console.log();
      }
    });
  });

  return res;
}

async function review<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  groups: IAutoBeTestScenarioApplication.IScenarioGroup[],
  progress: AutoBeProgressEventBase,
  life: number,
): Promise<IAutoBeTestScenarioApplication.IScenarioGroup[]> {
  if (life === 0) {
    return groups;
  }

  const pointer: IPointer<IAutoBeTestScenarioReviewApplication.IProps | null> =
    {
      value: null,
    };

  const { tokenUsage } = await ctx.conversate({
    source: "testScenariosReview",
    controller: createController({
      model: ctx.model,
      pointer,
      originalGroup: groups,
    }),
    histories: transformTestScenarioReviewHistories(ctx, groups),
    enforceFunctionCall: true,
    message: "Review the Test Scenario.",
  });

  if (pointer.value === null) {
    console.error("Failed to review test scenarios.");
    return groups;
  }

  ctx.dispatch({
    type: "testScenariosReview",
    id: v7(),
    tokenUsage,
    total: progress.total,
    completed: ++progress.completed,
    scenarios: pointer.value.scenarioGroups
      .map((group) => {
        return group.scenarios.map((s) => {
          return {
            ...s,
            endpoint: group.endpoint,
          } satisfies AutoBeTestScenario;
        });
      })
      .flat(),
    step: ctx.state().interface?.step ?? 0,
    created_at: new Date().toISOString(),
  });

  if (pointer.value.pass === true) {
    console.log(`Pass in life ${life}`);
    return pointer.value.scenarioGroups;
  }

  return await review(ctx, pointer.value.scenarioGroups, progress, life - 1);
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  pointer: IPointer<IAutoBeTestScenarioReviewApplication.IProps | null>;
  originalGroup: IAutoBeTestScenarioApplication.IScenarioGroup[];
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const validate: Validator = (
    next: unknown,
  ): IValidation<IAutoBeTestScenarioReviewApplication.IProps> => {
    const result: IValidation<IAutoBeTestScenarioReviewApplication.IProps> =
      typia.validate<IAutoBeTestScenarioReviewApplication.IProps>(next);
    if (result.success === false) return result;

    // merge to unique scenario groups
    const scenarioGroups: IAutoBeTestScenarioApplication.IScenarioGroup[] =
      uniqueScenarioGroups(result.data.scenarioGroups);

    const errors: IValidation.IError[] = [];

    // validate endpoints between scenarioGroups and groups
    const filteredScenarioGroups: IAutoBeTestScenarioApplication.IScenarioGroup[] =
      scenarioGroups.reduce<IAutoBeTestScenarioApplication.IScenarioGroup[]>(
        (acc, scenarioGroup) => {
          // Keep only groups whose endpoint matches with one in props.groups
          const matchingGroup = props.originalGroup.find(
            (g) =>
              g.endpoint.method === scenarioGroup.endpoint.method &&
              g.endpoint.path === scenarioGroup.endpoint.path,
          );

          if (!matchingGroup) {
            return acc;
          }

          return [...acc, scenarioGroup];
        },
        [],
      );

    result.data.scenarioGroups = filteredScenarioGroups;

    if (errors.length > 0) {
      return {
        success: false,
        errors,
        data: result.data,
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
    name: "Test Scenario Reviewer",
    application,
    execute: {
      review: (input) => {
        props.pointer.value = input;
      },
    } satisfies IAutoBeTestScenarioReviewApplication,
  };
}

const uniqueScenarioGroups = (
  groups: IAutoBeTestScenarioApplication.IScenarioGroup[],
): IAutoBeTestScenarioApplication.IScenarioGroup[] =>
  new HashMap(
    groups.map((g) => new Pair(g.endpoint, g)),
    AutoBeEndpointComparator.hashCode,
    AutoBeEndpointComparator.equals,
  )
    .toJSON()
    .map((it) => it.second);

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBeTestScenarioReviewApplication, "chatgpt">({
      validate: {
        review: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBeTestScenarioReviewApplication, "claude">({
      validate: {
        review: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeTestScenarioReviewApplication.IProps>;
