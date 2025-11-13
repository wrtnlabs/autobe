import { IAgenticaController } from "@agentica/core";
import {
  AutoBeEventSource,
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
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformInterfaceEndpointHistory } from "./histories/transformInterfaceEndpointHistory";
import { orchestrateInterfaceEndpointReview } from "./orchestrateInterfaceEndpointReview";
import { IAutoBeInterfaceEndpointApplication } from "./structures/IAutoBeInterfaceEndpointApplication";

export async function orchestrateInterfaceEndpoint<
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
  return await orchestrateInterfaceEndpointReview(ctx, deduplicated);
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
  const preliminary: AutoBePreliminaryController<
    "analyzeFiles" | "prismaSchemas"
  > = new AutoBePreliminaryController({
    functions: typia.json
      .application<IAutoBeInterfaceEndpointApplication>()
      .functions.map((f) => f.name),
    source: "interfaceEndpoint",
    kinds: ["analyzeFiles", "prismaSchemas"],
    state: ctx.state(),
  });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<AutoBeOpenApi.IEndpoint[] | null> = {
      value: null,
    };
    const result: AutoBeContext.IResult<Model> = await ctx.conversate({
      source: "interfaceEndpoint",
      controller: createController({
        model: ctx.model,
        build: (endpoints) => {
          pointer.value ??= endpoints;
          pointer.value.push(...endpoints);
        },
        preliminary,
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...transformInterfaceEndpointHistory({
        state: ctx.state(),
        group: props.group,
        authorizations: props.authorizations,
        instruction: props.instruction,
        preliminary,
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
        metric: result.metric,
        tokenUsage: result.tokenUsage,
        created_at: start.toISOString(),
        step: ctx.state().analyze?.step ?? 0,
        completed: ++props.progress.completed,
        total: props.progress.total,
      };
      ctx.dispatch(event);
      return out(result)(pointer.value);
    }
    return out(result)(null);
  });
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  preliminary: AutoBePreliminaryController<"analyzeFiles" | "prismaSchemas">;
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
    props.preliminary,
  ) satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: "interfaceEndpoint" satisfies AutoBeEventSource,
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
  chatgpt: (
    preliminary: AutoBePreliminaryController<"analyzeFiles" | "prismaSchemas">,
  ) =>
    typia.llm.application<IAutoBeInterfaceEndpointApplication, "chatgpt">({
      validate: preliminary.createValidate(),
    }),
  claude: (
    preliminary: AutoBePreliminaryController<"analyzeFiles" | "prismaSchemas">,
  ) =>
    typia.llm.application<IAutoBeInterfaceEndpointApplication, "claude">({
      validate: preliminary.createValidate(),
    }),
  gemini: (
    preliminary: AutoBePreliminaryController<"analyzeFiles" | "prismaSchemas">,
  ) =>
    typia.llm.application<IAutoBeInterfaceEndpointApplication, "gemini">({
      validate: preliminary.createValidate(),
    }),
};
