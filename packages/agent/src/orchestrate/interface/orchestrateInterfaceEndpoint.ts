import { IAgenticaController } from "@agentica/core";
import {
  AutoBeEventSource,
  AutoBeInterfaceEndpointEvent,
  AutoBeOpenApi,
  AutoBePrisma,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { AutoBeInterfaceGroup } from "@autobe/interface/src/histories/contents/AutoBeInterfaceGroup";
import { AutoBeOpenApiEndpointComparator } from "@autobe/utils";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
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
  const prismaSchemas: Map<string, AutoBePrisma.IModel> = new Map(
    ctx
      .state()
      .prisma!.result.data.files.map((f) => f.models)
      .flat()
      .map((m) => [m.name, m]),
  );
  const preliminary: AutoBePreliminaryController<
    "analysisFiles" | "prismaSchemas"
  > = new AutoBePreliminaryController({
    application: typia.json.application<IAutoBeInterfaceEndpointApplication>(),
    source: SOURCE,
    kinds: ["analysisFiles", "prismaSchemas"],
    state: ctx.state(),
    local: {
      prismaSchemas: props.group.prismaSchemas
        .map((key) => prismaSchemas.get(key))
        .filter((m) => m !== undefined),
    },
  });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<AutoBeOpenApi.IEndpoint[] | null> = {
      value: null,
    };
    const result: AutoBeContext.IResult<Model> = await ctx.conversate({
      source: SOURCE,
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
        type: SOURCE,
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
  preliminary: AutoBePreliminaryController<"analysisFiles" | "prismaSchemas">;
  build: (endpoints: AutoBeOpenApi.IEndpoint[]) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const validate: Validator = (
    input: unknown,
  ): IValidation<IAutoBeInterfaceEndpointApplication.IProps> => {
    const result: IValidation<IAutoBeInterfaceEndpointApplication.IProps> =
      typia.validate<IAutoBeInterfaceEndpointApplication.IProps>(input);
    if (result.success === false || result.data.request.type === "complete")
      return result;
    return props.preliminary.validate({
      request: result.data.request,
    });
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
      process: (next) => {
        if (next.request.type === "complete")
          props.build(next.request.endpoints);
      },
    } satisfies IAutoBeInterfaceEndpointApplication,
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBeInterfaceEndpointApplication, "chatgpt">({
      validate: {
        process: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBeInterfaceEndpointApplication, "claude">({
      validate: {
        process: validate,
      },
    }),
  gemini: (validate: Validator) =>
    typia.llm.application<IAutoBeInterfaceEndpointApplication, "gemini">({
      validate: {
        process: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeInterfaceEndpointApplication.IProps>;

const SOURCE = "interfaceEndpoint" satisfies AutoBeEventSource;
