import { IAgenticaController } from "@agentica/core";
import {
  AutoBeEventSource,
  AutoBeInterfaceOperationEvent,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { AutoBeOpenApiEndpointComparator, StringUtil } from "@autobe/utils";
import { ILlmApplication, IValidation } from "@samchon/openapi";
import { HashMap, IPointer, Pair } from "tstl";
import typia from "typia";
import { NamingConvention } from "typia/lib/utils/NamingConvention";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformInterfaceOperationHistory } from "./histories/transformInterfaceOperationHistory";
import { orchestrateInterfaceOperationReview } from "./orchestrateInterfaceOperationReview";
import { AutoBeInterfaceOperationProgrammer } from "./programmers/AutoBeInterfaceOperationProgrammer";
import { IAutoBeInterfaceOperationApplication } from "./structures/IAutoBeInterfaceOperationApplication";
import { AutoBeJsonSchemaFactory } from "./utils/AutoBeJsonSchemaFactory";

export async function orchestrateInterfaceOperation(
  ctx: AutoBeContext,
  props: {
    instruction: string;
    endpoints: AutoBeOpenApi.IEndpoint[];
  },
): Promise<AutoBeOpenApi.IOperation[]> {
  // write
  const progress: AutoBeProgressEventBase = {
    total: props.endpoints.length,
    completed: 0,
  };
  const written: AutoBeOpenApi.IOperation[] = (
    await executeCachedBatch(
      ctx,
      props.endpoints.map((endpoint) => async (promptCacheKey) => {
        const row: AutoBeOpenApi.IOperation[] = await process(ctx, {
          endpoint,
          progress,
          promptCacheKey,
          instruction: props.instruction,
        });
        return row;
      }),
    )
  ).flat();

  // unique dictionary
  const unique: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation> =
    new HashMap(
      written.map(
        (w) =>
          new Pair(
            {
              path: w.path,
              method: w.method,
            },
            w,
          ),
      ),
      AutoBeOpenApiEndpointComparator.hashCode,
      AutoBeOpenApiEndpointComparator.equals,
    );

  // review
  const reviewProgress: AutoBeProgressEventBase = {
    completed: 0,
    total: written.length,
  };
  const reviewed: AutoBeOpenApi.IOperation[] =
    await orchestrateInterfaceOperationReview(ctx, {
      operations: written,
      progress: reviewProgress,
    });
  for (const r of reviewed)
    unique.set(
      {
        path: r.path,
        method: r.method,
      },
      r,
    );
  return unique.toJSON().map((it) => it.second);
}

async function process(
  ctx: AutoBeContext,
  props: {
    endpoint: AutoBeOpenApi.IEndpoint;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
    instruction: string;
  },
): Promise<AutoBeOpenApi.IOperation[]> {
  const prefix: string = NamingConvention.camel(ctx.state().analyze!.prefix);
  const preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "databaseSchemas"
    | "previousAnalysisFiles"
    | "previousDatabaseSchemas"
    | "previousInterfaceOperations"
  > = new AutoBePreliminaryController({
    application: typia.json.application<IAutoBeInterfaceOperationApplication>(),
    source: SOURCE,
    kinds: [
      "analysisFiles",
      "databaseSchemas",
      "previousAnalysisFiles",
      "previousDatabaseSchemas",
      "previousInterfaceOperations",
    ],
    state: ctx.state(),
  });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<AutoBeOpenApi.IOperation[] | null> = {
      value: null,
    };
    const result: AutoBeContext.IResult = await ctx.conversate({
      source: SOURCE,
      controller: createController({
        preliminary,
        actors: ctx.state().analyze?.actors.map((it) => it.name) ?? [],
        build: (op) => {
          pointer.value ??= [];
          for (const p of op.parameters)
            AutoBeJsonSchemaFactory.fixSchema(p.schema);
          const matrix: AutoBeOpenApi.IOperation[] =
            op.authorizationActors.length === 0
              ? [
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
                ]
              : op.authorizationActors.map((actor) => ({
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
          pointer.value.push(...matrix.flat());
          ++props.progress.completed;
        },
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...transformInterfaceOperationHistory({
        endpoint: props.endpoint,
        instruction: props.instruction,
        prefix,
        preliminary,
      }),
    });
    if (pointer.value === null) return out(result)(null);

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
  });
}

function createController(props: {
  actors: string[];
  preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "databaseSchemas"
    | "previousAnalysisFiles"
    | "previousDatabaseSchemas"
    | "previousInterfaceOperations"
  >;
  build: (operation: IAutoBeInterfaceOperationApplication.IOperation) => void;
}): IAgenticaController.IClass {
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

    const op: IAutoBeInterfaceOperationApplication.IOperation =
      result.data.request.operation;
    const errors: IValidation.IError[] = [];
    AutoBeInterfaceOperationProgrammer.validate({
      accessor: "$input.request.operation",
      errors,
      operation: op,
    });

    // validate roles
    if (props.actors.length === 0) op.authorizationActors = [];
    else if (op.authorizationActors.length !== 0 && props.actors.length !== 0)
      op.authorizationActors.forEach((actor, j) => {
        if (props.actors.includes(actor) === true) return;
        errors.push({
          path: `$input.request.operation.authorizationActors[${j}]`,
          expected: `null | ${props.actors.map((str) => JSON.stringify(str)).join(" | ")}`,
          description: StringUtil.trim`
            Actor "${actor}" is not defined in the roles list.

            Please select one of them below, or do not define (\`null\`):

            ${props.actors.map((role) => `- ${role}`).join("\n")}
          `,
          value: actor,
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

  const application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeInterfaceOperationApplication>({
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
        if (next.request.type === "complete")
          props.build(next.request.operation);
      },
    } satisfies IAutoBeInterfaceOperationApplication,
  };
}

const SOURCE = "interfaceOperation" satisfies AutoBeEventSource;
