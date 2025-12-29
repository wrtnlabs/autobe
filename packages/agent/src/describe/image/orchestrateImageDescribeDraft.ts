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
import { ILlmApplication, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { createAutoBeUserMessageContent } from "../../factory/createAutoBeMessageContent";
import { supportMistral } from "../../factory/supportMistral";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { transformImageDescribeDraftHistories } from "./histories/transformImageDescribeDraftHistories";
import { IAutoBeImageDescribeDraftApplication } from "./structures/IAutoBeImageDescribeDraftApplication";

export const orchestrateImageDescribeDrafts = async (
  ctx: AutoBeContext,
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
  const drafts: (AutoBeImageDescribeDraft | null)[] = await executeCachedBatch(
    ctx,
    imageContents.map((imageContent) => async (promptCacheKey) => {
      try {
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
      } catch {
        return null;
      }
    }),
  );
  return drafts.filter((d) => d !== null);
};

async function process(
  ctx: AutoBeContext,
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

  const agent: MicroAgentica = new MicroAgentica({
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
  agent.on("request", (e) => {
    if (!!e.body.tools?.length) {
      e.body.tool_choice = "required";
    }
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

function createController(props: {
  build: (next: IAutoBeImageDescribeDraftApplication.IProps) => void;
}): IAgenticaController.IClass {
  const validate = (
    next: unknown,
  ): IValidation<IAutoBeImageDescribeDraftApplication.IProps> => {
    const result: IValidation<IAutoBeImageDescribeDraftApplication.IProps> =
      typia.validate<IAutoBeImageDescribeDraftApplication.IProps>(next);
    if (result.success === false) return result;
    return result;
  };

  const application: ILlmApplication =
    typia.llm.application<IAutoBeImageDescribeDraftApplication>({
      validate: {
        analyzeImage: validate,
      },
    });
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
