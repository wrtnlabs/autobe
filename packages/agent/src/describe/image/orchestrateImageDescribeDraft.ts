import {
  IAgenticaController,
  IAgenticaTokenUsageJson,
  MicroAgentica,
} from "@agentica/core";
import {
  AutoBeImageDescribeDraft,
  AutoBeImageDescribeDraftEvent,
  AutoBeProgressEventBase,
  AutoBeUserConversateContent,
  AutoBeUserImageConversateContent,
} from "@autobe/interface";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { createAutoBeUserMessageContent } from "../../factory/createAutoBeMessageContent";
import { supportMistral } from "../../factory/supportMistral";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { transformImageDescribeDraftHistories } from "./histories/transformImageDescribeDraftHistories";
import { IAutoBeImageDescribeDraftApplication } from "./structures/IAutoBeImageDescribeDraftApplication";

export const orchestrateImageDescribeDrafts = async <
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  props: {
    content: AutoBeUserConversateContent[];
  },
): Promise<AutoBeImageDescribeDraft[]> => {
  const [imageContents, otherContents] = props.content.reduce(
    (acc, cur) => {
      if (cur.type === "image") {
        acc[0].push(cur);
      } else {
        acc[1].push(cur);
      }
      return acc;
    },
    [
      [] as AutoBeUserImageConversateContent[],
      [] as AutoBeUserConversateContent[],
    ],
  );

  const progress: AutoBeProgressEventBase = {
    total: imageContents.length,
    completed: 0,
  };

  // Process each image individually
  return await executeCachedBatch(
    ctx,
    imageContents.map((imageContent) => async (promptCacheKey) => {
      const event: AutoBeImageDescribeDraftEvent = await process(ctx, {
        imageContents: [imageContent], // Single image
        userContents: otherContents,
        progress,
        promptCacheKey,
      });
      ctx.dispatch(event);
      return {
        ...event,
        image: imageContent,
        description: event.draft,
      };
    }),
  );
};

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    imageContents: AutoBeUserImageConversateContent[];
    userContents: AutoBeUserConversateContent[];
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<AutoBeImageDescribeDraftEvent> {
  const pointer: IPointer<IAutoBeImageDescribeDraftApplication.IProps | null> =
    {
      value: null,
    };
  const content: AutoBeUserConversateContent[] = [
    ...props.imageContents,
    ...props.userContents,
  ];

  const agent: MicroAgentica<Model> = new MicroAgentica<Model>({
    model: ctx.model,
    vendor: ctx.vendor,
    config: {
      executor: {
        describe: false,
      },
      retry: ctx.retry,
    },
    histories: transformImageDescribeDraftHistories(),
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
  await agent.conversate(
    content.map((c) => createAutoBeUserMessageContent({ content: c })),
  );
  const tokenUsage: IAgenticaTokenUsageJson.IComponent = agent
    .getTokenUsage()
    .toJSON().aggregate;
  ctx.usage().record(tokenUsage, ["facade"]);
  props.progress.completed += props.imageContents.length;
  if (pointer.value === null) throw new Error("Failed to analyze image.");

  const event: AutoBeImageDescribeDraftEvent = {
    type: "imageDescribeDraft",
    id: v7(),
    observation: pointer.value.observation,
    analysis: pointer.value.analysis,
    topics: pointer.value.topics,
    summary: pointer.value.summary,
    draft: pointer.value.description,
    completed: props.progress.completed,
    tokenUsage,
    total: props.progress.total,
    created_at: new Date().toISOString(),
  };
  return event;
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (next: IAutoBeImageDescribeDraftApplication.IProps) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const validate: Validator = (next: unknown) => {
    const result: IValidation<IAutoBeImageDescribeDraftApplication.IProps> =
      typia.validate<IAutoBeImageDescribeDraftApplication.IProps>(next);
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
    name: "image",
    application,
    execute: {
      analyzeImage: (next) => {
        props.build(next);
      },
    } satisfies IAutoBeImageDescribeDraftApplication,
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBeImageDescribeDraftApplication, "chatgpt">({
      validate: {
        analyzeImage: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBeImageDescribeDraftApplication, "claude">({
      validate: {
        analyzeImage: validate,
      },
    }),
  gemini: (validate: Validator) =>
    typia.llm.application<IAutoBeImageDescribeDraftApplication, "gemini">({
      validate: {
        analyzeImage: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeImageDescribeDraftApplication.IProps>;
