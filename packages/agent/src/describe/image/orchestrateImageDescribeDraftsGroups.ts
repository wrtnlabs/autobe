import {
  IAgenticaController,
  IAgenticaTokenUsageJson,
  MicroAgentica,
} from "@agentica/core";
import {
  AutoBeImageDescribeDraftEvent,
  AutoBeImageDescribeDraftGroup,
  AutoBeImageDescribeDraftGroupEvent,
  AutoBeImageDescribeDraftMetadata,
} from "@autobe/interface";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { HashMap, IPointer, Pair, hash } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { supportMistral } from "../../factory/supportMistral";
import { transformImageDescribeDraftsGroupsHistories } from "./histories/transformImageDescribeDraftsGroupsHistories";
import { IAutoBeImageDescribeGroupsApplication } from "./structures/IAutoBeImageDescribeGroupsApplication";

export const orchestrateImageDescribeDraftsGroups = async <
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  props: {
    drafts: AutoBeImageDescribeDraftEvent[];
  },
): Promise<AutoBeImageDescribeDraftGroup[]> => {
  // Extract metadata with indices for grouping
  const metadataList: AutoBeImageDescribeDraftMetadata[] = props.drafts.map(
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

  const exclude: AutoBeImageDescribeDraftGroup[] = [];
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
    metadataList: AutoBeImageDescribeDraftMetadata[];
    drafts: AutoBeImageDescribeDraftEvent[];
    existingGroups: AutoBeImageDescribeDraftGroup[];
  },
): Promise<{
  event: AutoBeImageDescribeDraftGroupEvent;
  processedKeys: string[];
}> {
  const pointer: IPointer<IAutoBeImageDescribeGroupsApplication.IProps | null> =
    {
      value: null,
    };

  const { histories, userMessage } =
    transformImageDescribeDraftsGroupsHistories({
      metadata: props.metadataList,
      existingGroups: props.existingGroups,
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
  if (pointer.value === null) throw new Error("Failed to group image drafts.");

  // Track processed original cluster keys
  const processedKeys: string[] = pointer.value.groups.map(
    (g) => g.originClusterKey,
  );

  // Convert grouped data to full draft groups
  const groups: AutoBeImageDescribeDraftGroup[] = pointer.value.groups.map(
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
  const event: AutoBeImageDescribeDraftGroupEvent = {
    type: "imageDescribeDraftGroup",
    id: v7(),
    groups,
    tokenUsage,
    created_at: new Date().toISOString(),
  };

  ctx.dispatch(event);

  return { event, processedKeys };
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (next: IAutoBeImageDescribeGroupsApplication.IProps) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const validate: Validator = (next: unknown) => {
    const result: IValidation<IAutoBeImageDescribeGroupsApplication.IProps> =
      typia.validate<IAutoBeImageDescribeGroupsApplication.IProps>(next);
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
    } satisfies IAutoBeImageDescribeGroupsApplication,
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBeImageDescribeGroupsApplication, "chatgpt">({
      validate: {
        groupDrafts: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBeImageDescribeGroupsApplication, "claude">({
      validate: {
        groupDrafts: validate,
      },
    }),
  gemini: (validate: Validator) =>
    typia.llm.application<IAutoBeImageDescribeGroupsApplication, "gemini">({
      validate: {
        groupDrafts: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeImageDescribeGroupsApplication.IProps>;
