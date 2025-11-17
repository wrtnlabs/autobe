import { IAgenticaController } from "@agentica/core";
import {
  AutoBeEventSource,
  AutoBeProgressEventBase,
  AutoBeTestScenario,
} from "@autobe/interface";
import { AutoBeOpenApiEndpointComparator } from "@autobe/utils";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { HashMap, IPointer, Pair } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformTestScenarioReviewHistory } from "./histories/transformTestScenarioReviewHistory";
import { IAutoBeTestScenarioApplication } from "./structures/IAutoBeTestScenarioApplication";
import { IAutoBeTestScenarioReviewApplication } from "./structures/IAutoBeTestScenarioReviewApplication";

export const orchestrateTestScenarioReview = async <
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  props: {
    preliminary: AutoBePreliminaryController<
      "analysisFiles" | "interfaceOperations" | "interfaceSchemas"
    >;
    groups: IAutoBeTestScenarioApplication.IScenarioGroup[];
    progress: AutoBeProgressEventBase;
    instruction: string;
  },
): Promise<IAutoBeTestScenarioApplication.IScenarioGroup[]> => {
  try {
    return await process(ctx, props);
  } catch {
    props.progress.completed += props.groups.length;
    return props.groups;
  }
};

const process = <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    preliminary: AutoBePreliminaryController<
      "analysisFiles" | "interfaceOperations" | "interfaceSchemas"
    >;
    groups: IAutoBeTestScenarioApplication.IScenarioGroup[];
    progress: AutoBeProgressEventBase;
    instruction: string;
  },
): Promise<IAutoBeTestScenarioApplication.IScenarioGroup[]> =>
  props.preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeTestScenarioReviewApplication.IComplete | null> =
      {
        value: null,
      };
    const result: AutoBeContext.IResult<Model> = await ctx.conversate({
      source: SOURCE,
      controller: createController({
        model: ctx.model,
        originalGroups: props.groups,
        pointer,
        preliminary: props.preliminary,
      }),
      enforceFunctionCall: true,
      ...transformTestScenarioReviewHistory({
        state: ctx.state(),
        groups: props.groups,
        instruction: props.instruction,
        preliminary: props.preliminary,
      }),
    });
    if (pointer.value !== null) {
      props.progress.total = Math.max(
        props.progress.total,
        (props.progress.completed += pointer.value.scenarioGroups.length),
      );
      ctx.dispatch({
        type: SOURCE,
        id: v7(),
        metric: result.metric,
        tokenUsage: result.tokenUsage,
        total: props.progress.total,
        completed: props.progress.completed,
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
      // @todo michael: need to investigate scenario removal more gracefully
      return out(result)(
        pointer.value.pass
          ? // || pointer.value.scenarioGroups.length < props.groups.length
            props.groups
          : pointer.value.scenarioGroups,
      );
    }
    return out(result)(null);
  });

const createController = <Model extends ILlmSchema.Model>(props: {
  model: Model;
  pointer: IPointer<IAutoBeTestScenarioReviewApplication.IComplete | null>;
  originalGroups: IAutoBeTestScenarioApplication.IScenarioGroup[];
  preliminary: AutoBePreliminaryController<
    "analysisFiles" | "interfaceOperations" | "interfaceSchemas"
  >;
}): IAgenticaController.IClass<Model> => {
  assertSchemaModel(props.model);

  const validate: Validator = (
    next: unknown,
  ): IValidation<IAutoBeTestScenarioReviewApplication.IProps> => {
    const result: IValidation<IAutoBeTestScenarioReviewApplication.IProps> =
      typia.validate<IAutoBeTestScenarioReviewApplication.IProps>(next);
    if (result.success === false) return result;
    else if (result.data.request.type !== "complete")
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request: result.data.request,
      });

    // merge to unique scenario groups
    const scenarioGroups: IAutoBeTestScenarioApplication.IScenarioGroup[] =
      uniqueScenarioGroups(result.data.request.scenarioGroups);

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
    result.data.request.scenarioGroups = filteredScenarioGroups;

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
    props.model === "chatgpt"
      ? "chatgpt"
      : props.model === "gemini"
        ? "gemini"
        : "claude"
  ](
    validate,
  ) satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>;

  return {
    protocol: "class",
    name: SOURCE,
    application,
    execute: {
      process: (input) => {
        if (input.request.type === "complete")
          props.pointer.value = input.request;
      },
    } satisfies IAutoBeTestScenarioReviewApplication,
  };
};

const uniqueScenarioGroups = (
  groups: IAutoBeTestScenarioApplication.IScenarioGroup[],
): IAutoBeTestScenarioApplication.IScenarioGroup[] =>
  new HashMap(
    groups.map((g) => new Pair(g.endpoint, g)),
    AutoBeOpenApiEndpointComparator.hashCode,
    AutoBeOpenApiEndpointComparator.equals,
  )
    .toJSON()
    .map((it) => it.second);

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBeTestScenarioReviewApplication, "chatgpt">({
      validate: {
        process: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBeTestScenarioReviewApplication, "claude">({
      validate: {
        process: validate,
      },
    }),
  gemini: (validate: Validator) =>
    typia.llm.application<IAutoBeTestScenarioReviewApplication, "gemini">({
      validate: {
        process: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeTestScenarioReviewApplication.IProps>;

const SOURCE = "testScenarioReview" satisfies AutoBeEventSource;
