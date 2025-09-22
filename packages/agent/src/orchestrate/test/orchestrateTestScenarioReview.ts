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
  );
  return res;
}

async function review<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  groups: IAutoBeTestScenarioApplication.IScenarioGroup[],
  progress: AutoBeProgressEventBase,
): Promise<IAutoBeTestScenarioApplication.IScenarioGroup[]> {
  try {
    const pointer: IPointer<IAutoBeTestScenarioReviewApplication.IProps | null> =
      {
        value: null,
      };
    const { tokenUsage } = await ctx.conversate({
      source: "testScenariosReview",
      controller: createController({
        model: ctx.model,
        pointer,
        originalGroups: groups,
      }),
      histories: transformTestScenarioReviewHistories(ctx, groups),
      enforceFunctionCall: true,
      message: "Review the Test Scenario.",
    });
    if (pointer.value === null) {
      // unreachable
      throw new Error("Failed to get review result.");
    }

    progress.total = Math.max(
      progress.total,
      (progress.completed += pointer.value.scenarioGroups.length),
    );

    ctx.dispatch({
      type: "testScenariosReview",
      id: v7(),
      tokenUsage,
      total: progress.total,
      completed: progress.completed,
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
    return pointer.value.scenarioGroups;
  } catch {
    progress.completed += groups.length;
    return groups;
  }
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  pointer: IPointer<IAutoBeTestScenarioReviewApplication.IProps | null>;
  originalGroups: IAutoBeTestScenarioApplication.IScenarioGroup[];
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

    // validate endpoints between scenarioGroups and originalGroups
    const filteredScenarioGroups: IAutoBeTestScenarioApplication.IScenarioGroup[] =
      props.originalGroups.reduce<
        IAutoBeTestScenarioApplication.IScenarioGroup[]
      >((acc, originalGroup) => {
        // Keep only groups whose endpoint matches with one in props.originalGroups
        const matchingGroup = scenarioGroups.find(
          (g) =>
            g.endpoint.method === originalGroup.endpoint.method &&
            g.endpoint.path === originalGroup.endpoint.path,
        );

        if (!matchingGroup) {
          return [...acc, originalGroup];
        }

        return [...acc, matchingGroup];
      }, []);

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
