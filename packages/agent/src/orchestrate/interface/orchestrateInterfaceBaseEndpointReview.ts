import { IAgenticaController } from "@agentica/core";
import { AutoBeEventSource, AutoBeOpenApi } from "@autobe/interface";
import { AutoBeInterfaceEndpointReviewEvent } from "@autobe/interface/src/events/AutoBeInterfaceEndpointReviewEvent";
import { AutoBeOpenApiEndpointComparator } from "@autobe/utils";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { HashSet, IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformInterfaceBaseEndpointReviewHistory } from "./histories/transformInterfaceBaseEndpointReviewHistory";
import { IAutoBeInterfaceBaseEndpointApplication } from "./structures/IAutoBeInterfaceBaseEndpointApplication";
import { IAutoBeInterfaceBaseEndpointReviewApplication } from "./structures/IAutoBeInterfaceBaseEndpointReviewApplication";

export async function orchestrateInterfaceBaseEndpointReview<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  props: {
    endpoints: IAutoBeInterfaceBaseEndpointApplication.IEndpoint[];
    authorizations: AutoBeOpenApi.IOperation[];
  },
): Promise<AutoBeOpenApi.IEndpoint[]> {
  // Initialize endpoint set with current endpoints
  const endpointSet: HashSet<IAutoBeInterfaceBaseEndpointApplication.IEndpoint> =
    new HashSet(
      props.endpoints,
      (e) => AutoBeOpenApiEndpointComparator.hashCode(e.endpoint),
      (a, b) => AutoBeOpenApiEndpointComparator.equals(a.endpoint, b.endpoint),
    );

  const preliminary: AutoBePreliminaryController<
    "analysisFiles" | "prismaSchemas"
  > = new AutoBePreliminaryController({
    application:
      typia.json.application<IAutoBeInterfaceBaseEndpointReviewApplication>(),
    source: SOURCE,
    kinds: ["analysisFiles", "prismaSchemas"],
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
      authorizations: props.authorizations,
      preliminary,
      endpointSet,
    },
    ctx.retry,
  );
}

async function predicate<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    endpoints: IAutoBeInterfaceBaseEndpointApplication.IEndpoint[];
    authorizations: AutoBeOpenApi.IOperation[];
    preliminary: AutoBePreliminaryController<"analysisFiles" | "prismaSchemas">;
    endpointSet: HashSet<IAutoBeInterfaceBaseEndpointApplication.IEndpoint>;
  },
  life: number,
): Promise<AutoBeOpenApi.IEndpoint[]> {
  if (life < 0) return props.endpointSet.toJSON().map((e) => e.endpoint);

  const pointer: IPointer<IAutoBeInterfaceBaseEndpointReviewApplication.IComplete | null> =
    {
      value: null,
    };

  await process(ctx, {
    authorizations: props.authorizations,
    preliminary: props.preliminary,
    endpointSet: props.endpointSet,
    pointer,
  });

  if (pointer.value !== null && pointer.value.actions.length === 0)
    return props.endpointSet.toJSON().map((e) => e.endpoint);
  return await predicate(ctx, props, life - 1);
}

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    authorizations: AutoBeOpenApi.IOperation[];
    preliminary: AutoBePreliminaryController<"analysisFiles" | "prismaSchemas">;
    endpointSet: HashSet<IAutoBeInterfaceBaseEndpointApplication.IEndpoint>;
    pointer: IPointer<IAutoBeInterfaceBaseEndpointReviewApplication.IComplete | null>;
  },
): Promise<void> {
  const start: Date = new Date();
  await props.preliminary.orchestrate(ctx, async (out) => {
    const result: AutoBeContext.IResult<Model> = await ctx.conversate({
      source: SOURCE,
      controller: createController({
        preliminary: props.preliminary,
        model: ctx.model,
        endpointSet: props.endpointSet,
        build: (next) => {
          props.pointer.value = next;
        },
      }),
      enforceFunctionCall: true,
      ...transformInterfaceBaseEndpointReviewHistory({
        preliminary: props.preliminary,
        endpoints: props.endpointSet.toJSON(),
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
        kind: "base",
        endpoints: props.endpointSet.toJSON().map((e) => e.endpoint),
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

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  preliminary: AutoBePreliminaryController<"analysisFiles" | "prismaSchemas">;
  endpointSet: HashSet<IAutoBeInterfaceBaseEndpointApplication.IEndpoint>;
  build: (
    props: IAutoBeInterfaceBaseEndpointReviewApplication.IComplete,
  ) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const validate: Validator = (input) => {
    const result =
      typia.validate<IAutoBeInterfaceBaseEndpointReviewApplication.IProps>(
        input,
      );
    if (result.success === false) return result;
    const request = result.data.request;

    if (request.type === "complete") {
      const checkExists = (
        endpoint: AutoBeOpenApi.IEndpoint,
        path: string,
        shouldExist: boolean,
      ): IValidation.IError | null => {
        const exists = props.endpointSet.has({ endpoint, description: "" });
        if (shouldExist && !exists)
          return {
            path,
            expected: "existing endpoint",
            value: endpoint,
            description: `Endpoint ${endpoint.method.toUpperCase()} ${endpoint.path} does not exist.`,
          };
        if (!shouldExist && exists)
          return {
            path,
            expected: "non-existing endpoint",
            value: endpoint,
            description: `Endpoint ${endpoint.method.toUpperCase()} ${endpoint.path} already exists.`,
          };
        return null;
      };

      const errors: IValidation.IError[] = request.actions
        .flatMap((item, i) => {
          const path = `request.actions[${i}]`;

          switch (item.type) {
            case "create":
              return checkExists(item.endpoint, path, false);
            case "update":
              return (
                checkExists(item.original, path, true) ??
                checkExists(item.updated, path, false)
              );
            case "delete":
              return checkExists(item.endpoint, path, true);
          }
        })
        .filter((error) => error !== null);

      if (errors.length > 0) {
        return { success: false, data: result.data, errors };
      }
      return result;
    }

    return props.preliminary.validate({
      thinking: result.data.thinking,
      request,
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
        const request = next.request;

        if (request.type === "complete") {
          // Process all actions
          for (const item of request.actions) {
            switch (item.type) {
              case "create":
                if (
                  props.endpointSet.has({
                    endpoint: item.endpoint,
                    description: "",
                  }) === false
                )
                  props.endpointSet.insert({
                    endpoint: item.endpoint,
                    description: item.description,
                  });
                break;
              case "update": {
                const hasOriginal = props.endpointSet.has({
                  endpoint: item.original,
                  description: "",
                });
                const hasUpdated = props.endpointSet.has({
                  endpoint: item.updated,
                  description: "",
                });
                if (
                  hasOriginal &&
                  (AutoBeOpenApiEndpointComparator.equals(
                    item.original,
                    item.updated,
                  ) ||
                    !hasUpdated)
                ) {
                  props.endpointSet.erase({
                    endpoint: item.original,
                    description: "",
                  });
                  props.endpointSet.insert({
                    endpoint: item.updated,
                    description: item.description,
                  });
                }
                break;
              }
              case "delete":
                if (
                  props.endpointSet.has({
                    endpoint: item.endpoint,
                    description: "",
                  }) === true
                )
                  props.endpointSet.erase({
                    endpoint: item.endpoint,
                    description: "",
                  });
                break;
            }
          }
          // Build the result
          props.build(request);
        }
      },
    } satisfies IAutoBeInterfaceBaseEndpointReviewApplication,
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<
      IAutoBeInterfaceBaseEndpointReviewApplication,
      "chatgpt"
    >({
      validate: {
        process: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<
      IAutoBeInterfaceBaseEndpointReviewApplication,
      "claude"
    >({
      validate: {
        process: validate,
      },
    }),
  gemini: (validate: Validator) =>
    typia.llm.application<
      IAutoBeInterfaceBaseEndpointReviewApplication,
      "gemini"
    >({
      validate: {
        process: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeInterfaceBaseEndpointReviewApplication.IProps>;

const SOURCE = "interfaceEndpointReview" satisfies AutoBeEventSource;
