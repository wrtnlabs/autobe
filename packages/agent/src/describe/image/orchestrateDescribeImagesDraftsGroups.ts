import { IAgenticaController } from "@agentica/core";
import {
  AutoBeDescribeImageDraftEvent,
  AutoBeDescribeImageDraftGroup,
  AutoBeDescribeImageDraftGroupEvent,
  AutoBeDescribeImageDraftMetadata,
} from "@autobe/interface";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { HashMap, IPointer, Pair, hash } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { transformDescribeImagesDraftsGroupsHistories } from "./histories/transformDescribeImagesDraftsGroupsHistories";
import { IAutoBeDescribeImagesGroupsApplication } from "./structures/IAutoBeDescribeImagesGroupsApplication";

export const orchestrateDescribeImagesDraftsGroups = async <
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  props: {
    drafts: AutoBeDescribeImageDraftEvent[];
  },
): Promise<AutoBeDescribeImageDraftGroup[]> => {
  // Extract metadata with indices for grouping
  const metadataList: AutoBeDescribeImageDraftMetadata[] = props.drafts.map(
    (draft) => ({
      ...draft.metadata,
    }),
  );

  // Use HashMap to track remaining cluster keys
  const include: HashMap<string, boolean> = new HashMap<string, boolean>(
    metadataList.map((metadata) => new Pair(metadata.clusterKey, true)),
    hash,
    (x, y) => x === y,
  );

  const exclude: AutoBeDescribeImageDraftGroup[] = [];
  let trial: number = 0;

  do {
    const result = await process(ctx, {
      metadataList,
      drafts: props.drafts,
      existingGroups: exclude,
    });

    for (const key of result.processedKeys) {
      include.erase(key);
    }
  } while (include.size() > 0 && ++trial < ctx.retry);

  return exclude;
};

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    metadataList: AutoBeDescribeImageDraftMetadata[];
    drafts: AutoBeDescribeImageDraftEvent[];
    existingGroups: AutoBeDescribeImageDraftGroup[];
  },
): Promise<{
  event: AutoBeDescribeImageDraftGroupEvent;
  processedKeys: string[];
}> {
  const pointer: IPointer<IAutoBeDescribeImagesGroupsApplication.IProps | null> =
    {
      value: null,
    };

  const { metric, tokenUsage } = await ctx.conversate({
    source: "describeImageDraftGroup",
    controller: createController({
      model: ctx.model,
      build: (next) => {
        pointer.value = next;
      },
    }),
    enforceFunctionCall: true,
    ...transformDescribeImagesDraftsGroupsHistories({
      metadata: props.metadataList,
      existingGroups: props.existingGroups,
    }),
  });

  if (pointer.value === null) throw new Error("Failed to group image drafts.");

  // Track processed original cluster keys
  const processedKeys: string[] = pointer.value.groups.map(
    (g) => g.originClusterKey,
  );

  // Convert grouped data to full draft groups
  const groups: AutoBeDescribeImageDraftGroup[] = pointer.value.groups.map(
    (group) => {
      // Find all drafts with this original cluster key
      const matchingDrafts = props.drafts.filter(
        (draft) => draft.metadata.clusterKey === group.originClusterKey,
      );

      return {
        clusterKey: group.newClusterKey,
        summary: group.summary,
        topics: group.topics,
        drafts: matchingDrafts.map((draft) => draft.draft),
      };
    },
  );

  // Add newly created groups to include list
  props.existingGroups.push(...groups);

  // Create and emit event
  const event: AutoBeDescribeImageDraftGroupEvent = {
    type: "describeImageDraftGroup",
    id: v7(),
    groups,
    metric,
    tokenUsage,
    created_at: new Date().toISOString(),
  };

  ctx.dispatch(event);

  return { event, processedKeys };
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (next: IAutoBeDescribeImagesGroupsApplication.IProps) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const validate: Validator = (next: unknown) => {
    const result: IValidation<IAutoBeDescribeImagesGroupsApplication.IProps> =
      typia.validate<IAutoBeDescribeImagesGroupsApplication.IProps>(next);
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
    name: "groups",
    application,
    execute: {
      groupDrafts: (next) => {
        props.build(next);
      },
    } satisfies IAutoBeDescribeImagesGroupsApplication,
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBeDescribeImagesGroupsApplication, "chatgpt">({
      validate: {
        groupDrafts: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBeDescribeImagesGroupsApplication, "claude">({
      validate: {
        groupDrafts: validate,
      },
    }),
  gemini: (validate: Validator) =>
    typia.llm.application<IAutoBeDescribeImagesGroupsApplication, "gemini">({
      validate: {
        groupDrafts: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeDescribeImagesGroupsApplication.IProps>;
