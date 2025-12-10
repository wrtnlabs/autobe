import { IAgenticaController } from "@agentica/core";
import {
  AutoBeEventSource,
  AutoBeInterfaceOperationEvent,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { AutoBeOpenApiEndpointComparator, StringUtil } from "@autobe/utils";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { HashMap, HashSet, IPointer } from "tstl";
import typia from "typia";
import { NamingConvention } from "typia/lib/utils/NamingConvention";
import { v7 } from "uuid";

import { AutoBeConfigConstant } from "../../constants/AutoBeConfigConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { divideArray } from "../../utils/divideArray";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformInterfaceOperationHistory } from "./histories/transformInterfaceOperationHistory";
import { orchestrateInterfaceOperationReview } from "./orchestrateInterfaceOperationReview";
import { IAutoBeInterfaceOperationApplication } from "./structures/IAutoBeInterfaceOperationApplication";
import { OperationValidator } from "./utils/OperationValidator";

export async function orchestrateInterfaceOperation<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  props: {
    instruction: string;
    endpoints: AutoBeOpenApi.IEndpoint[];
  },
): Promise<AutoBeOpenApi.IOperation[]> {
  const matrix: AutoBeOpenApi.IEndpoint[][] = divideArray({
    array: props.endpoints,
    capacity: AutoBeConfigConstant.INTERFACE_CAPACITY,
  });
  const progress: AutoBeProgressEventBase = {
    total: matrix.flat().length,
    completed: 0,
  };
  const reviewProgress: AutoBeProgressEventBase = {
    total: matrix.length,
    completed: 0,
  };
  return (
    await executeCachedBatch(
      ctx,
      matrix.map((it) => async (promptCacheKey) => {
        const row: AutoBeOpenApi.IOperation[] = await divideAndConquer(ctx, {
          endpoints: it,
          progress,
          reviewProgress,
          promptCacheKey,
          instruction: props.instruction,
        });
        return row;
      }),
    )
  ).flat();
}

async function divideAndConquer<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    endpoints: AutoBeOpenApi.IEndpoint[];
    progress: AutoBeProgressEventBase;
    reviewProgress: AutoBeProgressEventBase;
    promptCacheKey: string;
    instruction: string;
  },
): Promise<AutoBeOpenApi.IOperation[]> {
  const remained: HashSet<AutoBeOpenApi.IEndpoint> = new HashSet(
    props.endpoints,
    AutoBeOpenApiEndpointComparator.hashCode,
    AutoBeOpenApiEndpointComparator.equals,
  );
  const unique: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation> =
    new HashMap(
      AutoBeOpenApiEndpointComparator.hashCode,
      AutoBeOpenApiEndpointComparator.equals,
    );
  for (let i: number = 0; i < ctx.retry; ++i) {
    if (remained.empty() === true || unique.size() >= props.endpoints.length)
      break;
    const operations: AutoBeOpenApi.IOperation[] = remained.size()
      ? await process(ctx, {
          endpoints: remained,
          progress: props.progress,
          promptCacheKey: props.promptCacheKey,
          instruction: props.instruction,
        })
      : [];

    for (const item of operations) {
      unique.set(item, item);
      remained.erase(item);
    }
  }
  const newbie: AutoBeOpenApi.IOperation[] =
    await orchestrateInterfaceOperationReview(
      ctx,
      unique.toJSON().map((it) => it.second),
      props.reviewProgress,
    );
  for (const item of newbie) unique.set(item, item);
  return unique.toJSON().map((it) => it.second);
}

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    endpoints: HashSet<AutoBeOpenApi.IEndpoint>;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
    instruction: string;
  },
): Promise<AutoBeOpenApi.IOperation[]> {
  const prefix: string = NamingConvention.camel(ctx.state().analyze!.prefix);
  const preliminary: AutoBePreliminaryController<
    "analysisFiles" | "prismaSchemas"
  > = new AutoBePreliminaryController({
    application: typia.json.application<IAutoBeInterfaceOperationApplication>(),
    source: SOURCE,
    kinds: ["analysisFiles", "prismaSchemas"],
    state: ctx.state(),
  });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<AutoBeOpenApi.IOperation[] | null> = {
      value: null,
    };
    const result: AutoBeContext.IResult<Model> = await ctx.conversate({
      source: SOURCE,
      controller: createController({
        preliminary,
        model: ctx.model,
        actors: ctx.state().analyze?.actors.map((it) => it.name) ?? [],
        build: (operations) => {
          pointer.value ??= [];
          const matrix: AutoBeOpenApi.IOperation[][] = operations.map((op) => {
            if (op.authorizationActors.length === 0)
              return [
                {
                  ...op,
                  path:
                    "/" +
                    [prefix, ...op.path.split("/")]
                      .filter((it) => it !== "")
                      .join("/"),
                  authorizationActor: null,
                  authorizationType: null,
                  prerequisites: [],
                },
              ];
            return op.authorizationActors.map((actor) => ({
              ...op,
              path:
                "/" +
                [prefix, actor, ...op.path.split("/")]
                  .filter((it) => it !== "")
                  .join("/"),
              authorizationActor: actor,
              authorizationType: null,
              prerequisites: [],
            }));
          });
          pointer.value.push(...matrix.flat());
          props.progress.completed += matrix.flat().length;
          props.progress.total += operations
            .map((op) =>
              props.endpoints.has({ path: op.path, method: op.method })
                ? op.authorizationActors.length === 0
                  ? 0
                  : op.authorizationActors.length - 1
                : op.authorizationActors.length,
            )
            .reduce((a, b) => a + b, 0);
        },
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...transformInterfaceOperationHistory({
        endpoints: props.endpoints.toJSON(),
        instruction: props.instruction,
        prefix,
        preliminary,
      }),
    });
    if (pointer.value !== null) {
      ctx.dispatch({
        type: SOURCE,
        id: v7(),
        operations: pointer.value,
        metric: result.metric,
        tokenUsage: result.tokenUsage,
        ...props.progress,
        step: ctx.state().analyze?.step ?? 0,
        created_at: new Date().toISOString(),
      } satisfies AutoBeInterfaceOperationEvent);
      return out(result)(pointer.value);
    }
    return out(result)(null);
  });
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  actors: string[];
  preliminary: AutoBePreliminaryController<"analysisFiles" | "prismaSchemas">;
  build: (
    operations: IAutoBeInterfaceOperationApplication.IOperation[],
  ) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const validate = (
    next: unknown,
  ): IValidation<IAutoBeInterfaceOperationApplication.IProps> => {
    const result: IValidation<IAutoBeInterfaceOperationApplication.IProps> =
      typia.validate<IAutoBeInterfaceOperationApplication.IProps>(next);
    if (result.success === false) return result;
    else if (result.data.request.type !== "complete")
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request: result.data.request,
      });

    const operations: IAutoBeInterfaceOperationApplication.IOperation[] =
      result.data.request.operations;
    const errors: IValidation.IError[] = [];
    OperationValidator.validate({
      path: "$input.request.operations",
      errors,
      operations,
    });

    operations.forEach((op, i) => {
      // validate roles
      if (props.actors.length === 0) op.authorizationActors = [];
      else if (op.authorizationActors.length !== 0 && props.actors.length !== 0)
        op.authorizationActors.forEach((actor, j) => {
          if (props.actors.includes(actor) === true) return;
          errors.push({
            path: `$input.request.operations[${i}].authorizationActors[${j}]`,
            expected: `null | ${props.actors.map((str) => JSON.stringify(str)).join(" | ")}`,
            description: StringUtil.trim`
              Actor "${actor}" is not defined in the roles list.

              Please select one of them below, or do not define (\`null\`):  

              ${props.actors.map((role) => `- ${role}`).join("\n")}
            `,
            value: actor,
          });
        });
    });
    if (errors.length !== 0)
      return {
        success: false,
        errors,
        data: next,
      };
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
    name: SOURCE,
    application,
    execute: {
      process: (next) => {
        if (next.request.type === "complete")
          props.build(next.request.operations);
      },
    } satisfies IAutoBeInterfaceOperationApplication,
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBeInterfaceOperationApplication, "chatgpt">({
      validate: {
        process: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBeInterfaceOperationApplication, "claude">({
      validate: {
        process: validate,
      },
    }),
  gemini: (validate: Validator) =>
    typia.llm.application<IAutoBeInterfaceOperationApplication, "gemini">({
      validate: {
        process: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeInterfaceOperationApplication.IProps>;

const SOURCE = "interfaceOperation" satisfies AutoBeEventSource;
