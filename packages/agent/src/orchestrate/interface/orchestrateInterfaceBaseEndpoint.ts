import { IAgenticaController } from "@agentica/core";
import {
  AutoBeDatabase,
  AutoBeEventSource,
  AutoBeInterfaceEndpointEvent,
  AutoBeInterfaceGroup,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";
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
    reviewProgress: AutoBeProgressEventBase;
  },
): Promise<AutoBeOpenApi.IEndpoint[]> {
  const endpoints: AutoBeOpenApi.IEndpoint[] = (
    await executeCachedBatch(
      ctx,
      props.groups.map((group) => async (promptCacheKey) => {
        const generated: IAutoBeInterfaceBaseEndpointApplication.IEndpoint[] =
          await process(ctx, {
            group,
            progress: props.progress,
            promptCacheKey,
            instruction: props.instruction,
            authorizations: props.authorizations,
          });

        const reviewed: AutoBeOpenApi.IEndpoint[] =
          await orchestrateInterfaceBaseEndpointReview(ctx, {
            endpoints: generated,
            authorizations: props.authorizations,
            group,
            progress: props.reviewProgress,
          });

        return reviewed;
      }),
    )
  ).flat();

  // Final deduplication across all groups
  const deduplicated: AutoBeOpenApi.IEndpoint[] = new HashSet(
    endpoints,
    AutoBeOpenApiEndpointComparator.hashCode,
    AutoBeOpenApiEndpointComparator.equals,
  ).toJSON();

  return deduplicated;
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
  const databaseSchemas: Map<string, AutoBeDatabase.IModel> = new Map(
    ctx
      .state()
      .database!.result.data.files.flatMap((f) => f.models)
      .map((m) => [m.name, m]),
  );

  const preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "databaseSchemas"
    | "previousAnalysisFiles"
    | "previousDatabaseSchemas"
    | "previousInterfaceOperations"
  > = new AutoBePreliminaryController({
    application:
      typia.json.application<IAutoBeInterfaceBaseEndpointApplication>(),
    kinds: [
      "analysisFiles",
      "databaseSchemas",
      "previousAnalysisFiles",
      "previousDatabaseSchemas",
      "previousInterfaceOperations",
    ],
    source: SOURCE,
    state: ctx.state(),
    local: {
      databaseSchemas: props.group.databaseSchemas
        .map((key) => databaseSchemas.get(key))
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
    if (pointer.value === null) return out(result)(null);

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
  });
}

function createController(props: {
  preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "databaseSchemas"
    | "previousAnalysisFiles"
    | "previousDatabaseSchemas"
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
