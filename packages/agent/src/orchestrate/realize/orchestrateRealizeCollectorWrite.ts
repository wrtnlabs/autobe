import {
  AutoBeDatabase,
  AutoBeEventSource,
  AutoBeInterfaceHistory,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeRealizeCollectorFunction,
  AutoBeRealizeCollectorPlan,
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
import { transformRealizeCollectorWriteHistory } from "./histories/transformRealizeCollectorWriteHistory";
import { AutoBeRealizeCollectorProgrammer } from "./programmers/AutoBeRealizeCollectorProgrammer";
import { IAutoBeRealizeCollectorWriteApplication } from "./structures/IAutoBeRealizeCollectorWriteApplication";

export async function orchestrateRealizeCollectorWrite(
  ctx: AutoBeContext,
  props: {
    plans: AutoBeRealizeCollectorPlan[];
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeCollectorFunction[]> {
  const history: AutoBeInterfaceHistory | null = ctx.state().interface;
  if (history === null)
    throw new Error("Cannot realize collector write without interface.");

  const document: AutoBeOpenApi.IDocument = history.document;
  const getNeighbors = (
    plan: AutoBeRealizeCollectorPlan,
  ): AutoBeRealizeCollectorPlan[] => {
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
  const result: AutoBeRealizeCollectorFunction[] = await executeCachedBatch(
    ctx,
    props.plans.map(
      (x) => (promptCacheKey) =>
        process(ctx, {
          document: history.document,
          progress: props.progress,
          neighbors: getNeighbors(x),
          plan: x,
          promptCacheKey,
        }),
    ),
  );
  return result;
}

async function process(
  ctx: AutoBeContext,
  props: {
    document: AutoBeOpenApi.IDocument;
    plan: AutoBeRealizeCollectorPlan;
    neighbors: AutoBeRealizeCollectorPlan[];
    promptCacheKey: string;
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeCollectorFunction> {
  const models: AutoBeDatabase.IModel[] = ctx
    .state()
    .database!.result.data.files.map((f) => f.models)
    .flat();
  const dtoTypeName: string = props.plan.dtoTypeName;
  const location: string = `src/collectors/${AutoBeRealizeCollectorProgrammer.getName(dtoTypeName)}.ts`;
  const preliminary: AutoBePreliminaryController<"databaseSchemas"> =
    new AutoBePreliminaryController({
      state: ctx.state(),
      source: SOURCE,
      application:
        typia.json.application<IAutoBeRealizeCollectorWriteApplication>(),
      kinds: ["databaseSchemas"],
      local: {
        databaseSchemas: models.filter(
          (m) => m.name === props.plan.databaseSchemaName,
        ),
      },
    });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeRealizeCollectorWriteApplication.IComplete | null> =
      {
        value: null,
      };
    const result: AutoBeContext.IResult = await ctx.conversate({
      source: "realizeWrite",
      controller: createController(ctx, {
        plan: props.plan,
        neighbors: props.neighbors,
        build: (next) => {
          pointer.value = next;
        },
        preliminary,
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...(await transformRealizeCollectorWriteHistory(ctx, {
        plan: props.plan,
        neighbors: props.neighbors,
        preliminary,
      })),
    });
    if (pointer.value === null) return out(result)(null);

    const content: string =
      await AutoBeRealizeCollectorProgrammer.replaceImportStatements(ctx, {
        dtoTypeName,
        schemas: props.document.components.schemas,
        code: pointer.value.revise.final ?? pointer.value.draft,
      });
    const functor: AutoBeRealizeCollectorFunction = {
      type: "collector",
      plan: props.plan,
      neighbors: AutoBeRealizeCollectorProgrammer.getNeighbors(content),
      location,
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

function createController(
  ctx: AutoBeContext,
  props: {
    plan: AutoBeRealizeCollectorPlan;
    neighbors: AutoBeRealizeCollectorPlan[];
    build: (next: IAutoBeRealizeCollectorWriteApplication.IComplete) => void;
    preliminary: AutoBePreliminaryController<"databaseSchemas">;
  },
): ILlmController {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeRealizeCollectorWriteApplication.IProps> => {
    const result: IValidation<IAutoBeRealizeCollectorWriteApplication.IProps> =
      typia.validate<IAutoBeRealizeCollectorWriteApplication.IProps>(input);
    if (result.success === false) return result;
    else if (result.data.request.type !== "complete")
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request: result.data.request,
      });

    const errors: IValidation.IError[] =
      AutoBeRealizeCollectorProgrammer.validate({
        application: ctx.state().database!.result.data,
        mappings: result.data.request.mappings,
        plan: props.plan,
        neighbors: props.neighbors,
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

  const application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeRealizeCollectorWriteApplication>({
      validate: {
        process: validate,
      },
    }),
  );
  AutoBeRealizeCollectorProgrammer.fixApplication({
    definition: application,
    application: ctx.state().database!.result.data,
    model: ctx
      .state()
      .database!.result.data.files.map((f) => f.models)
      .flat()
      .find((m) => m.name === props.plan.databaseSchemaName)!,
  });

  return {
    protocol: "class",
    name: SOURCE,
    application,
    execute: {
      process: (next) => {
        if (next.request.type === "complete") props.build(next.request);
      },
    } satisfies IAutoBeRealizeCollectorWriteApplication,
  };
}

const SOURCE = "realizeWrite" satisfies AutoBeEventSource;
