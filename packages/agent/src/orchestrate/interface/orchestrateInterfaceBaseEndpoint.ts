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
import { ILlmApplication, IValidation } from "@samchon/openapi";
import { HashSet, IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformInterfaceBaseEndpointHistory } from "./histories/transformInterfaceBaseEndpointHistory";
import { orchestrateInterfaceBaseEndpointReview } from "./orchestrateInterfaceBaseEndpointReview";
import { IAutoBeInterfaceBaseEndpointApplication } from "./structures/IAutoBeInterfaceBaseEndpointApplication";

export async function orchestrateInterfaceBaseEndpoint(
  ctx: AutoBeContext,
  props: {
    instruction: string;
    groups: AutoBeInterfaceGroup[];
    authorizations: AutoBeOpenApi.IOperation[];
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeOpenApi.IEndpoint[]> {
  const endpoints: IAutoBeInterfaceBaseEndpointApplication.IEndpoint[] = (
    await executeCachedBatch(
      ctx,
      props.groups.map((group) => async (promptCacheKey) => {
        const event: IAutoBeInterfaceBaseEndpointApplication.IEndpoint[] =
          await process(ctx, {
            group,
            progress: props.progress,
            promptCacheKey,
            instruction: props.instruction,
            authorizations: props.authorizations,
          });
        return event;
      }),
    )
  ).flat();

  const deduplicated: IAutoBeInterfaceBaseEndpointApplication.IEndpoint[] =
    new HashSet(
      endpoints,
      (key) => AutoBeOpenApiEndpointComparator.hashCode(key.endpoint),
      (a, b) =>
        a.endpoint.path === b.endpoint.path &&
        a.endpoint.method === b.endpoint.method,
    ).toJSON();

  // Review the endpoints
  const reviewed: AutoBeOpenApi.IEndpoint[] =
    await orchestrateInterfaceBaseEndpointReview(ctx, {
      endpoints: deduplicated,
      authorizations: props.authorizations,
    });
  return reviewed;
}

async function process(
  ctx: AutoBeContext,
  props: {
    instruction: string;
    promptCacheKey: string;
    group: AutoBeInterfaceGroup;
    progress: AutoBeProgressEventBase;
    authorizations: AutoBeOpenApi.IOperation[];
  },
): Promise<IAutoBeInterfaceBaseEndpointApplication.IEndpoint[]> {
  const start: Date = new Date();
  const prismaSchemas: Map<string, AutoBePrisma.IModel> = new Map(
    ctx
      .state()
      .prisma!.result.data.files.flatMap((f) => f.models)
      .map((m) => [m.name, m]),
  );

  const preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "prismaSchemas"
    | "previousAnalysisFiles"
    | "previousPrismaSchemas"
    | "previousInterfaceOperations"
  > = new AutoBePreliminaryController({
    application:
      typia.json.application<IAutoBeInterfaceBaseEndpointApplication>(),
    kinds: [
      "analysisFiles",
      "prismaSchemas",
      "previousAnalysisFiles",
      "previousPrismaSchemas",
      "previousInterfaceOperations",
    ],
    source: SOURCE,
    state: ctx.state(),
    local: {
      prismaSchemas: props.group.prismaSchemas
        .map((key) => prismaSchemas.get(key))
        .filter((m) => m !== undefined),
    },
  });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeInterfaceBaseEndpointApplication.IComplete | null> =
      {
        value: null,
      };

    const result: AutoBeContext.IResult = await ctx.conversate({
      source: SOURCE,
      controller: createController({
        preliminary,
        build: (next) => {
          pointer.value ??= next;
          pointer.value.endpoints.push(...next.endpoints);
        },
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...transformInterfaceBaseEndpointHistory({
        state: ctx.state(),
        group: props.group,
        instruction: props.instruction,
        authorizations: props.authorizations,
        preliminary,
      }),
    });

    if (pointer.value !== null) {
      const event: AutoBeInterfaceEndpointEvent = {
        type: SOURCE,
        kind: "base",
        id: v7(),
        endpoints: new HashSet(
          pointer.value.endpoints.map((e) => e.endpoint),
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
      return out(result)(pointer.value.endpoints);
    }
    return out(result)(null);
  });
}

function createController(props: {
  preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "prismaSchemas"
    | "previousAnalysisFiles"
    | "previousPrismaSchemas"
    | "previousInterfaceOperations"
  >;
  build: (next: IAutoBeInterfaceBaseEndpointApplication.IComplete) => void;
}): IAgenticaController.IClass {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeInterfaceBaseEndpointApplication.IProps> => {
    const result: IValidation<IAutoBeInterfaceBaseEndpointApplication.IProps> =
      typia.validate<IAutoBeInterfaceBaseEndpointApplication.IProps>(input);
    if (result.success === false || result.data.request.type === "complete")
      return result;
    return props.preliminary.validate({
      thinking: result.data.thinking,
      request: result.data.request,
    });
  };

  const application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeInterfaceBaseEndpointApplication>({
      validate: {
        process: validate,
      },
    }),
  );

  return {
    protocol: "class",
    name: SOURCE,
    application,
    execute: {
      process: (next) => {
        if (next.request.type === "complete") props.build(next.request);
      },
    } satisfies IAutoBeInterfaceBaseEndpointApplication,
  };
}

const SOURCE = "interfaceEndpoint" satisfies AutoBeEventSource;
