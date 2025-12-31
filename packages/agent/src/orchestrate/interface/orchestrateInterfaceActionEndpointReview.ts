import { IAgenticaController } from "@agentica/core";
import {
  AutoBeEventSource,
  AutoBeInterfaceEndpointReviewEvent,
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
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformInterfaceActionEndpointReviewHistory } from "./histories/transformInterfaceActionEndpointReviewHistory";
import { IAutoBeInterfaceActionEndpointApplication } from "./structures/IAutoBeInterfaceActionEndpointApplication";
import { IAutoBeInterfaceActionEndpointReviewApplication } from "./structures/IAutoBeInterfaceActionEndpointReviewApplication";

export async function orchestrateInterfaceActionEndpointReview(
  ctx: AutoBeContext,
  props: {
    endpoints: IAutoBeInterfaceActionEndpointApplication.IEndpoint[];
    baseEndpoints: AutoBeOpenApi.IEndpoint[];
    authorizations: AutoBeOpenApi.IOperation[];
    group: AutoBeInterfaceGroup;
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeOpenApi.IEndpoint[]> {
  // Initialize endpoint set with current action endpoints
  const endpointSet: HashSet<IAutoBeInterfaceActionEndpointApplication.IEndpoint> =
    new HashSet(
      props.endpoints,
      (e) => AutoBeOpenApiEndpointComparator.hashCode(e.endpoint),
      (a, b) => AutoBeOpenApiEndpointComparator.equals(a.endpoint, b.endpoint),
    );

  const preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "databaseSchemas"
    | "previousAnalysisFiles"
    | "previousDatabaseSchemas"
    | "previousInterfaceOperations"
  > = new AutoBePreliminaryController({
    application:
      typia.json.application<IAutoBeInterfaceActionEndpointReviewApplication>(),
    source: SOURCE,
    kinds: [
      "analysisFiles",
      "databaseSchemas",
      "previousAnalysisFiles",
      "previousDatabaseSchemas",
      "previousInterfaceOperations",
    ],
    state: ctx.state(),
    local: {
      analysisFiles: ctx.state().analyze?.files ?? [],
      databaseSchemas:
        ctx
          .state()
          .database?.result.data.files.map((f) => f.models)
          .flat() ?? [],
    },
  });

  return await predicate(
    ctx,
    {
      endpoints: props.endpoints,
      baseEndpoints: props.baseEndpoints,
      authorizations: props.authorizations,
      preliminary,
      originalEndpoints: props.endpoints.map((e) => e.endpoint),
      endpointSet,
      group: props.group,
      progress: props.progress,
    },
    ctx.retry,
  );
}

async function predicate(
  ctx: AutoBeContext,
  props: {
    endpoints: IAutoBeInterfaceActionEndpointApplication.IEndpoint[];
    baseEndpoints: AutoBeOpenApi.IEndpoint[];
    authorizations: AutoBeOpenApi.IOperation[];
    preliminary: AutoBePreliminaryController<
      | "analysisFiles"
      | "databaseSchemas"
      | "previousAnalysisFiles"
      | "previousDatabaseSchemas"
      | "previousInterfaceOperations"
    >;
    originalEndpoints: AutoBeOpenApi.IEndpoint[];
    endpointSet: HashSet<IAutoBeInterfaceActionEndpointApplication.IEndpoint>;
    group: AutoBeInterfaceGroup;
    progress: AutoBeProgressEventBase;
  },
  life: number,
): Promise<AutoBeOpenApi.IEndpoint[]> {
  const pointer: IPointer<IAutoBeInterfaceActionEndpointReviewApplication.IComplete | null> =
    { value: null };

  const processed: AutoBeInterfaceEndpointReviewEvent = await process(ctx, {
    baseEndpoints: props.baseEndpoints,
    authorizations: props.authorizations,
    preliminary: props.preliminary,
    originalEndpoints: props.originalEndpoints,
    endpointSet: props.endpointSet,
    pointer,
    group: props.group,
    progress: props.progress,
  });

  if (life > 0) {
    if (pointer.value === null || pointer.value.actions.length > 0)
      return await predicate(ctx, props, life - 1);
  }
  ctx.dispatch({
    ...processed,
    type: SOURCE,
    kind: "action",
    completed: ++props.progress.completed,
    content: props.endpointSet.toJSON().map((e) => e.endpoint),
  });
  return props.endpointSet.toJSON().map((e) => e.endpoint);
}

async function process(
  ctx: AutoBeContext,
  props: {
    baseEndpoints: AutoBeOpenApi.IEndpoint[];
    authorizations: AutoBeOpenApi.IOperation[];
    preliminary: AutoBePreliminaryController<
      | "analysisFiles"
      | "databaseSchemas"
      | "previousAnalysisFiles"
      | "previousDatabaseSchemas"
      | "previousInterfaceOperations"
    >;
    originalEndpoints: AutoBeOpenApi.IEndpoint[];
    endpointSet: HashSet<IAutoBeInterfaceActionEndpointApplication.IEndpoint>;
    pointer: IPointer<IAutoBeInterfaceActionEndpointReviewApplication.IComplete | null>;
    group: AutoBeInterfaceGroup;
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeInterfaceEndpointReviewEvent> {
  const start: Date = new Date();

  return await props.preliminary.orchestrate(ctx, async (out) => {
    const result: AutoBeContext.IResult = await ctx.conversate({
      source: SOURCE,
      controller: createController({
        preliminary: props.preliminary,
        endpointSet: props.endpointSet,
        build: (next) => {
          props.pointer.value = next;
        },
      }),
      enforceFunctionCall: true,
      ...transformInterfaceActionEndpointReviewHistory({
        preliminary: props.preliminary,
        endpoints: props.endpointSet.toJSON(),
        baseEndpoints: props.baseEndpoints,
        authorizations: props.authorizations,
        group: props.group,
      }),
    });

    if (props.pointer.value !== null) {
      const finalEndpoints: AutoBeOpenApi.IEndpoint[] = props.endpointSet
        .toJSON()
        .map((e) => e.endpoint);

      const event: AutoBeInterfaceEndpointReviewEvent = {
        id: v7(),
        type: SOURCE,
        kind: "action",
        endpoints: props.originalEndpoints,
        content: finalEndpoints,
        review: props.pointer.value.review,
        created_at: start.toISOString(),
        step: ctx.state().analyze?.step ?? 0,
        completed: props.progress.completed,
        total: props.progress.total,
        metric: result.metric,
        tokenUsage: result.tokenUsage,
      };
      return out(result)(event);
    }
    return out(result)(null);
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
  endpointSet: HashSet<IAutoBeInterfaceActionEndpointApplication.IEndpoint>;
  build: (
    props: IAutoBeInterfaceActionEndpointReviewApplication.IComplete,
  ) => void;
}): IAgenticaController.IClass {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeInterfaceActionEndpointReviewApplication.IProps> => {
    const result =
      typia.validate<IAutoBeInterfaceActionEndpointReviewApplication.IProps>(
        input,
      );
    if (result.success === false) return result;
    const request = result.data.request;
    if (request.type === "complete") return result;

    return props.preliminary.validate({
      thinking: result.data.thinking,
      request,
    });
  };

  const application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeInterfaceActionEndpointReviewApplication>({
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
        const request = next.request;

        if (request.type === "complete") {
          // Process all actions
          for (const action of request.actions) {
            switch (action.type) {
              case "create":
                if (props.endpointSet.has(action) === false)
                  props.endpointSet.insert({
                    endpoint: action.endpoint,
                    description: "",
                  });
                break;
              case "update": {
                const hasOriginal = props.endpointSet.has({
                  endpoint: action.original,
                  description: "",
                });
                const hasUpdated = props.endpointSet.has({
                  endpoint: action.updated,
                  description: "",
                });
                if (
                  hasOriginal &&
                  (AutoBeOpenApiEndpointComparator.equals(
                    action.original,
                    action.updated,
                  ) ||
                    !hasUpdated)
                ) {
                  props.endpointSet.erase({
                    endpoint: action.original,
                    description: "",
                  });
                  props.endpointSet.insert({
                    endpoint: action.updated,
                    description: "",
                  });
                }
                break;
              }
              case "delete":
                if (
                  props.endpointSet.has({
                    endpoint: action.endpoint,
                    description: "",
                  }) === true
                )
                  props.endpointSet.erase({
                    endpoint: action.endpoint,
                    description: "",
                  });
                break;
            }
          }
          // Build the result
          props.build(request);
        }
      },
    } satisfies IAutoBeInterfaceActionEndpointReviewApplication,
  };
}

const SOURCE = "interfaceEndpointReview" satisfies AutoBeEventSource;
