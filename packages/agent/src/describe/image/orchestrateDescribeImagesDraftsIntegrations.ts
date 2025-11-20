import {
  IAgenticaController,
  IAgenticaTokenUsageJson,
  MicroAgentica,
} from "@agentica/core";
import {
  AutoBeDescribeImageDraftGroup,
  AutoBeDescribeImageDraftIntegrationEvent,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { supportMistral } from "../../factory/supportMistral";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { transformDescribeImagesDraftsIntegrationsHistories } from "./histories/transformDescribeImagesDraftsIntegrationsHistories";
import { IAutoBeDescribeImagesDraftsIntegrationsApplication } from "./structures/IAutoBeDescribeImagesDraftsIntegrationsApplication";

export const orchestrateDescribeImagesDraftsIntegrations = async <
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  props: {
    groups: AutoBeDescribeImageDraftGroup[];
  },
): Promise<AutoBeDescribeImageDraftIntegrationEvent[]> => {
  const progress: AutoBeProgressEventBase = {
    total: props.groups.length,
    completed: 0,
  };

  return await executeCachedBatch(
    ctx,
    props.groups.map((group) => async (promptCacheKey) => {
      const event = await processGroup(ctx, {
        group,
        progress,
        promptCacheKey,
      });
      ctx.dispatch(event);
      return event;
    }),
  );
};

async function processGroup<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    group: AutoBeDescribeImageDraftGroup;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<AutoBeDescribeImageDraftIntegrationEvent> {
  const pointer: IPointer<IAutoBeDescribeImagesDraftsIntegrationsApplication.IProps | null> =
    {
      value: null,
    };

  const { histories, userMessage } =
    transformDescribeImagesDraftsIntegrationsHistories({
      group: props.group,
    });

  const agent: MicroAgentica<Model> = new MicroAgentica<Model>({
    model: ctx.model,
    vendor: ctx.vendor,
    config: {
      executor: {
        describe: false,
      },
      retry: ctx.retry,
    },
    histories,
    controllers: [
      createController({
        model: ctx.model,
        build: (next) => {
          pointer.value = next;
        },
      }),
    ],
  });
  supportMistral(agent, {
    api: ctx.vendor.api,
    model: ctx.vendor.model,
    options: ctx.vendor.options,
    semaphore:
      typeof ctx.vendor.semaphore === "number"
        ? ctx.vendor.semaphore
        : ctx.vendor.semaphore?.max(),
  });
  await agent.conversate(userMessage);
  const tokenUsage: IAgenticaTokenUsageJson.IComponent = agent
    .getTokenUsage()
    .toJSON().aggregate;
  ctx.usage().record(tokenUsage, ["facade"]);
  props.progress.completed += 1;
  if (pointer.value === null)
    throw new Error(
      `Failed to integrate drafts for group: ${props.group.clusterKey}`,
    );

  const event: AutoBeDescribeImageDraftIntegrationEvent = {
    type: "describeImageDraftIntegration",
    id: v7(),
    clusterKey: props.group.clusterKey,
    integration: pointer.value.integration,
    tokenUsage,
    completed: props.progress.completed,
    total: props.progress.total,
    created_at: new Date().toISOString(),
  };

  return event;
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (
    next: IAutoBeDescribeImagesDraftsIntegrationsApplication.IProps,
  ) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const validate: Validator = (next: unknown) => {
    const result: IValidation<IAutoBeDescribeImagesDraftsIntegrationsApplication.IProps> =
      typia.validate<IAutoBeDescribeImagesDraftsIntegrationsApplication.IProps>(
        next,
      );
    if (result.success === false) return result;
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
    name: "integration",
    application,
    execute: {
      integrateDrafts: (next) => {
        props.build(next);
      },
    } satisfies IAutoBeDescribeImagesDraftsIntegrationsApplication,
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<
      IAutoBeDescribeImagesDraftsIntegrationsApplication,
      "chatgpt"
    >({
      validate: {
        integrateDrafts: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<
      IAutoBeDescribeImagesDraftsIntegrationsApplication,
      "claude"
    >({
      validate: {
        integrateDrafts: validate,
      },
    }),
  gemini: (validate: Validator) =>
    typia.llm.application<
      IAutoBeDescribeImagesDraftsIntegrationsApplication,
      "gemini"
    >({
      validate: {
        integrateDrafts: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeDescribeImagesDraftsIntegrationsApplication.IProps>;
