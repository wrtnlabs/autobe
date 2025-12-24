import { IAgenticaController } from "@agentica/core";
import { AutoBeEventSource, AutoBeOpenApi } from "@autobe/interface";
import { AutoBeInterfaceEndpointReviewEvent } from "@autobe/interface/src/events/AutoBeInterfaceEndpointReviewEvent";
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
    | "prismaSchemas"
    | "previousAnalysisFiles"
    | "previousPrismaSchemas"
    | "previousInterfaceOperations"
  > = new AutoBePreliminaryController({
    application:
      typia.json.application<IAutoBeInterfaceActionEndpointReviewApplication>(),
    source: SOURCE,
    kinds: [
      "analysisFiles",
      "prismaSchemas",
      "previousAnalysisFiles",
      "previousPrismaSchemas",
      "previousInterfaceOperations",
    ],
    state: ctx.state(),
    local: {
      analysisFiles: ctx.state().analyze?.files ?? [],
      prismaSchemas:
        ctx
          .state()
          .prisma?.result.data.files.map((f) => f.models)
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
      endpointSet,
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
      | "prismaSchemas"
      | "previousAnalysisFiles"
      | "previousPrismaSchemas"
      | "previousInterfaceOperations"
    >;
    endpointSet: HashSet<IAutoBeInterfaceActionEndpointApplication.IEndpoint>;
  },
  life: number,
): Promise<AutoBeOpenApi.IEndpoint[]> {
  if (life < 0) return props.endpointSet.toJSON().map((e) => e.endpoint);

  const pointer: IPointer<IAutoBeInterfaceActionEndpointReviewApplication.IComplete | null> =
    {
      value: null,
    };

  await process(ctx, {
    baseEndpoints: props.baseEndpoints,
    authorizations: props.authorizations,
    preliminary: props.preliminary,
    endpointSet: props.endpointSet,
    pointer,
  });

  if (pointer.value !== null && pointer.value.actions.length === 0)
    return props.endpointSet.toJSON().map((e) => e.endpoint);
  return await predicate(ctx, props, life - 1);
}

async function process(
  ctx: AutoBeContext,
  props: {
    baseEndpoints: AutoBeOpenApi.IEndpoint[];
    authorizations: AutoBeOpenApi.IOperation[];
    preliminary: AutoBePreliminaryController<
      | "analysisFiles"
      | "prismaSchemas"
      | "previousAnalysisFiles"
      | "previousPrismaSchemas"
      | "previousInterfaceOperations"
    >;
    endpointSet: HashSet<IAutoBeInterfaceActionEndpointApplication.IEndpoint>;
    pointer: IPointer<IAutoBeInterfaceActionEndpointReviewApplication.IComplete | null>;
  },
): Promise<void> {
  const start: Date = new Date();

  await props.preliminary.orchestrate(ctx, async (out) => {
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
        endpoints: finalEndpoints,
        content: finalEndpoints,
        review: props.pointer.value.review,
        created_at: start.toISOString(),
        step: ctx.state().analyze?.step ?? 0,
        metric: result.metric,
        tokenUsage: result.tokenUsage,
      };
      ctx.dispatch(event);
      return out(result)(finalEndpoints);
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
