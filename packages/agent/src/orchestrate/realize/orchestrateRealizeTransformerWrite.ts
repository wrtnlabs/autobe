import {
  AutoBeDatabase,
  AutoBeEventSource,
  AutoBeInterfaceHistory,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeRealizeTransformerFunction,
  AutoBeRealizeTransformerPlan,
  AutoBeRealizeWriteEvent,
} from "@autobe/interface";
import { AutoBeOpenApiTypeChecker } from "@autobe/utils";
import { ILlmApplication, ILlmController, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformRealizeTransformerWriteHistory } from "./histories/transformRealizeTransformerWriteHistory";
import { AutoBeRealizeTransformerProgrammer } from "./programmers/AutoBeRealizeTransformerProgrammer";
import { IAutoBeRealizeTransformerWriteApplication } from "./structures/IAutoBeRealizeTransformerWriteApplication";

export async function orchestrateRealizeTransformerWrite(
  ctx: AutoBeContext,
  props: {
    plans: AutoBeRealizeTransformerPlan[];
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeTransformerFunction[]> {
  const history: AutoBeInterfaceHistory | null = ctx.state().interface;
  if (history === null)
    throw new Error("Cannot realize transformer write without interface.");

  const document: AutoBeOpenApi.IDocument = history.document;
  const getNeighbors = (
    plan: AutoBeRealizeTransformerPlan,
  ): AutoBeRealizeTransformerPlan[] => {
    const visited: Set<string> = new Set();
    AutoBeOpenApiTypeChecker.visit({
      components: document.components,
      schema: { $ref: `#/components/schemas/${plan.dtoTypeName}` },
      closure: (next) => {
        if (AutoBeOpenApiTypeChecker.isReference(next)) {
          const key: string = next.$ref.split("/").pop()!;
          visited.add(key);
        }
      },
    });
    return props.plans.filter(
      (p) => p.dtoTypeName !== plan.dtoTypeName && visited.has(p.dtoTypeName),
    );
  };

  props.progress.total += props.plans.length;
  return await executeCachedBatch(
    ctx,
    props.plans.map(
      (x) => (promptCacheKey) =>
        process(ctx, {
          progress: props.progress,
          neighbors: getNeighbors(x),
          plan: x,
          promptCacheKey,
        }),
    ),
  );
}

async function process(
  ctx: AutoBeContext,
  props: {
    plan: AutoBeRealizeTransformerPlan;
    neighbors: AutoBeRealizeTransformerPlan[];
    promptCacheKey: string;
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeTransformerFunction> {
  const models: AutoBeDatabase.IModel[] = ctx
    .state()
    .database!.result.data.files.map((f) => f.models)
    .flat();
  const document: AutoBeOpenApi.IDocument = ctx.state().interface!.document;
  const dtoTypeName: string = props.plan.dtoTypeName;
  const preliminary: AutoBePreliminaryController<"databaseSchemas"> =
    new AutoBePreliminaryController({
      state: ctx.state(),
      source: SOURCE,
      application:
        typia.json.application<IAutoBeRealizeTransformerWriteApplication>(),
      kinds: ["databaseSchemas"],
      local: {
        databaseSchemas: models.filter(
          (m) => m.name === props.plan.databaseSchemaName,
        ),
      },
    });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeRealizeTransformerWriteApplication.IComplete | null> =
      {
        value: null,
      };
    const result: AutoBeContext.IResult = await ctx.conversate({
      source: "realizeWrite",
      controller: createController({
        application: ctx.state().database!.result.data,
        document,
        plan: props.plan,
        neighbors: props.neighbors,
        build: (next) => {
          pointer.value = next;
        },
        preliminary,
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...(await transformRealizeTransformerWriteHistory(ctx, {
        plan: props.plan,
        neighbors: props.neighbors,
        preliminary,
      })),
    });
    if (pointer.value === null) return out(result)(null);

    const content: string =
      await AutoBeRealizeTransformerProgrammer.replaceImportStatements(ctx, {
        dtoTypeName,
        schemas: document.components.schemas,
        code: pointer.value.revise.final ?? pointer.value.draft,
      });
    const functor: AutoBeRealizeTransformerFunction = {
      type: "transformer",
      plan: props.plan,
      neighbors: AutoBeRealizeTransformerProgrammer.getNeighbors(content),
      location: `src/transformers/${AutoBeRealizeTransformerProgrammer.getName(
        dtoTypeName,
      )}.ts`,
      content,
    };
    ctx.dispatch({
      id: v7(),
      type: "realizeWrite",
      function: functor,
      metric: result.metric,
      tokenUsage: result.tokenUsage,
      completed: ++props.progress.completed,
      total: props.progress.total,
      step: ctx.state().analyze?.step ?? 0,
      created_at: new Date().toISOString(),
    } satisfies AutoBeRealizeWriteEvent);
    return out(result)(functor);
  });
}

function createController(props: {
  application: AutoBeDatabase.IApplication;
  document: AutoBeOpenApi.IDocument;
  plan: AutoBeRealizeTransformerPlan;
  neighbors: AutoBeRealizeTransformerPlan[];
  build: (next: IAutoBeRealizeTransformerWriteApplication.IComplete) => void;
  preliminary: AutoBePreliminaryController<"databaseSchemas">;
}): ILlmController {
  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeRealizeTransformerWriteApplication.IProps> =
      typia.validate<IAutoBeRealizeTransformerWriteApplication.IProps>(input);
    if (result.success === false) return result;
    else if (result.data.request.type !== "complete")
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request: result.data.request,
      });

    const errors: IValidation.IError[] =
      AutoBeRealizeTransformerProgrammer.validate({
        application: props.application,
        document: props.document,
        plan: props.plan,
        neighbors: props.neighbors,
        transformMappings: result.data.request.transformMappings,
        selectMappings: result.data.request.selectMappings,
        draft: result.data.request.draft,
        revise: result.data.request.revise,
      });
    return errors.length
      ? {
          success: false,
          errors,
          data: result.data,
        }
      : result;
  };
  const application: ILlmApplication =
    typia.llm.application<IAutoBeRealizeTransformerWriteApplication>({
      validate: {
        process: validate,
      },
    });
  return {
    protocol: "class",
    name: SOURCE,
    application,
    execute: {
      process: (next) => {
        if (next.request.type === "complete") props.build(next.request);
      },
    } satisfies IAutoBeRealizeTransformerWriteApplication,
  };
}

type Validator = (
  input: unknown,
) => IValidation<IAutoBeRealizeTransformerWriteApplication.IProps>;

const SOURCE = "realizeWrite" satisfies AutoBeEventSource;
