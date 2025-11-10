import { AgenticaExecuteHistory, IAgenticaController } from "@agentica/core";
import {
  AutoBeInterfaceEndpointEvent,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { AutoBeInterfaceGroup } from "@autobe/interface/src/histories/contents/AutoBeInterfaceGroup";
import { AutoBeOpenApiEndpointComparator } from "@autobe/utils";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { HashSet, IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { PreliminaryApplicationValidator } from "../common/PreliminaryApplicationValidator";
import { orchestratePreliminary } from "../common/orchestratePreliminary";
import { IAutoBePreliminaryCollection } from "../common/structures/IAutoBePreliminaryCollection";
import { transformInterfaceEndpointHistories } from "./histories/transformInterfaceEndpointHistories";
import { orchestrateInterfaceEndpointsReview } from "./orchestrateInterfaceEndpointsReview";
import { IAutoBeInterfaceEndpointApplication } from "./structures/IAutoBeInterfaceEndpointApplication";

export async function orchestrateInterfaceEndpoints<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  props: {
    groups: AutoBeInterfaceGroup[];
    authorizations: AutoBeOpenApi.IOperation[];
    instruction: string;
    message?: string;
  },
): Promise<AutoBeOpenApi.IEndpoint[]> {
  const progress: AutoBeProgressEventBase = {
    total: props.groups.length,
    completed: 0,
  };
  const endpoints: AutoBeOpenApi.IEndpoint[] = (
    await executeCachedBatch(
      props.groups.map(
        (group) => (promptCacheKey) =>
          process(ctx, {
            group,
            authorizations: props.authorizations,
            instruction: props.instruction,
            progress,
            promptCacheKey,
          }),
      ),
    )
  ).flat();
  const deduplicated: AutoBeOpenApi.IEndpoint[] = new HashSet(
    endpoints,
    AutoBeOpenApiEndpointComparator.hashCode,
    AutoBeOpenApiEndpointComparator.equals,
  ).toJSON();
  return await orchestrateInterfaceEndpointsReview(ctx, deduplicated);
}

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    group: AutoBeInterfaceGroup;
    progress: AutoBeProgressEventBase;
    authorizations: AutoBeOpenApi.IOperation[];
    promptCacheKey: string;
    instruction: string;
  },
): Promise<AutoBeOpenApi.IEndpoint[]> {
  const start: Date = new Date();
  const all: IAutoBePreliminaryCollection = {
    analyzeFiles: ctx.state().analyze!.files,
    prismaSchemas: ctx
      .state()
      .prisma!.result.data.files.map((f) => f.models)
      .flat(),
    interfaceOperations: [],
    interfaceSchemas: {},
  };
  const partial: IAutoBePreliminaryCollection = {
    analyzeFiles: [],
    prismaSchemas: [],
    interfaceOperations: [],
    interfaceSchemas: {},
  };

  while (true) {
    const pointer: IPointer<AutoBeOpenApi.IEndpoint[] | null> = {
      value: null,
    };
    const { metric, tokenUsage, histories } = await ctx.conversate({
      source: "interfaceEndpoint",
      controller: createController({
        model: ctx.model,
        build: (endpoints) => {
          pointer.value ??= endpoints;
          pointer.value.push(...endpoints);
        },
        all,
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...transformInterfaceEndpointHistories({
        state: ctx.state(),
        group: props.group,
        authorizations: props.authorizations,
        instruction: props.instruction,
      }),
    });
    if (pointer.value !== null) {
      const event: AutoBeInterfaceEndpointEvent = {
        type: "interfaceEndpoint",
        id: v7(),
        endpoints: new HashSet(
          pointer.value,
          AutoBeOpenApiEndpointComparator.hashCode,
          AutoBeOpenApiEndpointComparator.equals,
        ).toJSON(),
        metric,
        tokenUsage,
        created_at: start.toISOString(),
        step: ctx.state().analyze?.step ?? 0,
        completed: ++props.progress.completed,
        total: props.progress.total,
      };
      ctx.dispatch(event);
      return pointer.value;
    }

    const executes: AgenticaExecuteHistory<Model>[] = histories.filter(
      (h) => h.type === "execute",
    );
    if (executes.length === 0) throw new Error("Failed to generate endpoints."); // unreachable
    orchestratePreliminary(ctx, {
      executes,
      all,
      partial,
    });
    continue;
  }
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  all: IAutoBePreliminaryCollection;
  build: (endpoints: AutoBeOpenApi.IEndpoint[]) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const application: ILlmApplication<Model> = collection[
    props.model === "chatgpt"
      ? "chatgpt"
      : props.model === "gemini"
        ? "gemini"
        : "claude"
  ](
    props.all,
  ) satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: "interface",
    application,
    execute: {
      makeEndpoints: (next) => {
        props.build(next.endpoints);
      },
      analyzeFiles: () => {},
      prismaSchemas: () => {},
    } satisfies IAutoBeInterfaceEndpointApplication,
  };
}

const collection = {
  chatgpt: (all: IAutoBePreliminaryCollection) =>
    typia.llm.application<IAutoBeInterfaceEndpointApplication, "chatgpt">({
      validate: PreliminaryApplicationValidator.createValidate(
        ["analyzeFiles", "prismaSchemas"],
        all,
      ),
    }),
  claude: (all: IAutoBePreliminaryCollection) =>
    typia.llm.application<IAutoBeInterfaceEndpointApplication, "claude">({
      validate: PreliminaryApplicationValidator.createValidate(
        ["analyzeFiles", "prismaSchemas"],
        all,
      ),
    }),
  gemini: (all: IAutoBePreliminaryCollection) =>
    typia.llm.application<IAutoBeInterfaceEndpointApplication, "gemini">({
      validate: PreliminaryApplicationValidator.createValidate(
        ["analyzeFiles", "prismaSchemas"],
        all,
      ),
    }),
};
