import { IAgenticaController } from "@agentica/core";
import {
  AutoBeDescribeImageDraftEvent,
  AutoBeProgressEventBase,
  AutoBeUserConversateContent,
  AutoBeUserImageConversateContent,
} from "@autobe/interface";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeConfigConstant } from "../../constants/AutoBeConfigConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { createAutoBeUserMessageContent } from "../../factory/createAutoBeMessageContent";
import { divideArray } from "../../utils/divideArray";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { transformDescribeImagesDraftHistories } from "./histories/transformDescribeImagesDraftHistories";
import { IAutoBeDescribeImagesDraftApplication } from "./structures/IAutoBeDescribeImagesDraftApplication";

export const orchestrateDescribeImagesDrafts = async <
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  props: {
    content: AutoBeUserConversateContent[];
    capacity?: number;
  },
): Promise<AutoBeDescribeImageDraftEvent[]> => {
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

  const matrix: AutoBeUserImageConversateContent[][] = divideArray({
    array: imageContents,
    capacity: props.capacity ?? AutoBeConfigConstant.DESCRIBE_CAPACITY,
  });
  const progress: AutoBeProgressEventBase = {
    total: imageContents.length,
    completed: 0,
  };
  return (
    await executeCachedBatch(
      matrix.map((it) => async (promptCacheKey) => {
        const event: AutoBeDescribeImageDraftEvent = await process(ctx, {
          imageContents: it,
          userContents: otherContents,
          progress,
          promptCacheKey,
        });
        ctx.dispatch(event);
        return event;
      }),
    )
  ).flat();
};

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    imageContents: AutoBeUserImageConversateContent[];
    userContents: AutoBeUserConversateContent[];
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<AutoBeDescribeImageDraftEvent> {
  const pointer: IPointer<IAutoBeDescribeImagesDraftApplication.IProps | null> =
    {
      value: null,
    };
  const content: AutoBeUserConversateContent[] = [
    ...props.imageContents,
    ...props.userContents,
  ];

  const { metric, tokenUsage } = await ctx.conversate({
    source: "describeImageDraft",
    controller: createController({
      model: ctx.model,
      build: (next) => {
        pointer.value = next;
      },
    }),
    enforceFunctionCall: true,
    histories: transformDescribeImagesDraftHistories(),
    userMessage:
      content.length > 0
        ? content.map((c) => createAutoBeUserMessageContent({ content: c }))
        : "Analyze the image content and generate a draft of the planning document.",
    promptCacheKey: props.promptCacheKey,
  });
  props.progress.completed += props.imageContents.length;
  if (pointer.value === null) throw new Error("Failed to analyze image.");

  const event: AutoBeDescribeImageDraftEvent = {
    type: "describeImageDraft",
    id: v7(),
    draft: pointer.value.draft,
    metadata: pointer.value.metadata,
    completed: props.progress.completed,
    total: props.progress.total,
    metric,
    tokenUsage,
    created_at: new Date().toISOString(),
  };
  return event;
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (next: IAutoBeDescribeImagesDraftApplication.IProps) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const validate: Validator = (next: unknown) => {
    const result: IValidation<IAutoBeDescribeImagesDraftApplication.IProps> =
      typia.validate<IAutoBeDescribeImagesDraftApplication.IProps>(next);
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
    } satisfies IAutoBeDescribeImagesDraftApplication,
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBeDescribeImagesDraftApplication, "chatgpt">({
      validate: {
        analyzeImage: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBeDescribeImagesDraftApplication, "claude">({
      validate: {
        analyzeImage: validate,
      },
    }),
  gemini: (validate: Validator) =>
    typia.llm.application<IAutoBeDescribeImagesDraftApplication, "gemini">({
      validate: {
        analyzeImage: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeDescribeImagesDraftApplication.IProps>;
