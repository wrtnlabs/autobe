import {
  AutoBeAssistantMessageHistory,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeRealizeAuthorization,
  AutoBeRealizeCollectorFunction,
  AutoBeRealizeCollectorPlan,
  AutoBeRealizeHistory,
  AutoBeRealizeOperationFunction,
  AutoBeRealizeTransformerFunction,
  AutoBeRealizeTransformerPlan,
  IAutoBeCompiler,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { predicateStateMessage } from "../../utils/predicateStateMessage";
import { IAutoBeFacadeApplicationProps } from "../facade/histories/IAutoBeFacadeApplicationProps";
import { orchestrateRealizeAuthorizationWrite } from "./orchestrateRealizeAuthorizationWrite";
import { orchestrateRealizeCollectorPlan } from "./orchestrateRealizeCollectorPlan";
import { orchestrateRealizeCollectorWrite } from "./orchestrateRealizeCollectorWrite";
import { orchestrateRealizeCorrectCasting } from "./orchestrateRealizeCorrectCasting";
import { orchestrateRealizeOperationWrite } from "./orchestrateRealizeOperationWrite";
import { orchestrateRealizeTransformerPlan } from "./orchestrateRealizeTransformerPlan";
import { orchestrateRealizeTransformerWrite } from "./orchestrateRealizeTransformerWrite";
import { AutoBeRealizeCollectorProgrammer } from "./programmers/AutoBeRealizeCollectorProgrammer";
import { AutoBeRealizeOperationProgrammer } from "./programmers/AutoBeRealizeOperationProgrammer";
import { AutoBeRealizeTransformerProgrammer } from "./programmers/AutoBeRealizeTransformerProgrammer";
import { IAutoBeRealizeScenarioResult } from "./structures/IAutoBeRealizeScenarioResult";

export const orchestrateRealize =
  <Model extends ILlmSchema.Model>(ctx: AutoBeContext<Model>) =>
  async (
    props: IAutoBeFacadeApplicationProps,
  ): Promise<AutoBeAssistantMessageHistory | AutoBeRealizeHistory> => {
    // PREDICATION
    const document: AutoBeOpenApi.IDocument | undefined =
      ctx.state().interface?.document;
    if (document === undefined)
      throw new Error("Can't do realize agent because operations are nothing.");

    const start: Date = new Date();
    const predicate: string | null = predicateStateMessage(
      ctx.state(),
      "realize",
    );
    if (predicate !== null)
      return ctx.assistantMessage({
        type: "assistantMessage",
        id: v7(),
        created_at: start.toISOString(),
        text: predicate,
        completed_at: new Date().toISOString(),
      });
    ctx.dispatch({
      type: "realizeStart",
      id: v7(),
      created_at: start.toISOString(),
      reason: props.instruction,
      step: ctx.state().test?.step ?? 0,
    });

    // PREPARE ASSETS
    const planProgress: AutoBeProgressEventBase = {
      completed: 0,
      total:
        Object.keys(document.components.schemas).filter(
          AutoBeRealizeCollectorProgrammer.filter,
        ).length +
        Object.keys(document.components.schemas).filter(
          AutoBeRealizeTransformerProgrammer.filter,
        ).length,
    };
    const writeProgress: AutoBeProgressEventBase = {
      completed: 0,
      total: document.operations.length,
    };
    const correctProgress: AutoBeProgressEventBase = {
      completed: 0,
      total: 0,
    };

    const authorizations: AutoBeRealizeAuthorization[] =
      await orchestrateRealizeAuthorizationWrite(ctx);
    const collectors: AutoBeRealizeCollectorFunction[] = await makeCollectors(
      ctx,
      {
        planProgress,
        writeProgress,
        correctProgress,
      },
    );
    const transformers: AutoBeRealizeTransformerFunction[] =
      await makeTransformers(ctx, {
        planProgress,
        writeProgress,
        correctProgress,
      });
    const operations: AutoBeRealizeOperationFunction[] = await makeOperations(
      ctx,
      {
        authorizations,
        collectors,
        transformers,
        writeProgress,
        correctProgress,
      },
    );

    const compiler: IAutoBeCompiler = await ctx.compiler();
    const controllers: Record<string, string> =
      await compiler.realize.controller({
        document: ctx.state().interface!.document,
        functions: operations,
        authorizations,
      });
    return ctx.dispatch({
      type: "realizeComplete",
      id: v7(),
      functions: [...collectors, ...transformers, ...operations],
      authorizations,
      controllers,
      compiled: {
        type: "success", // @todo fake
      },
      aggregates: ctx.getCurrentAggregates("realize"),
      step: ctx.state().analyze?.step ?? 0,
      elapsed: new Date().getTime() - start.getTime(),
      created_at: new Date().toISOString(),
    });
  };

async function makeCollectors(
  ctx: AutoBeContext<any>,
  props: {
    planProgress: AutoBeProgressEventBase;
    writeProgress: AutoBeProgressEventBase;
    correctProgress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeCollectorFunction[]> {
  const plans: AutoBeRealizeCollectorPlan[] =
    await orchestrateRealizeCollectorPlan(ctx, {
      progress: props.planProgress,
    });
  const writes: AutoBeRealizeCollectorFunction[] =
    await orchestrateRealizeCollectorWrite(ctx, {
      plans,
      progress: props.writeProgress,
    });
  return await orchestrateRealizeCorrectCasting(ctx, {
    programmer: {
      template: (func) =>
        AutoBeRealizeCollectorProgrammer.getTemplate(func.plan),
      replaceImportStatements: (next) =>
        AutoBeRealizeCollectorProgrammer.replaceImportStatements(ctx, {
          dtoTypeName: next.function.plan.dtoTypeName,
          schemas: ctx.state().interface!.document.components.schemas,
          code: next.code,
        }),
      additional: () => ({}),
    },
    functions: writes,
    progress: props.correctProgress,
  });
}

async function makeTransformers(
  ctx: AutoBeContext<any>,
  props: {
    planProgress: AutoBeProgressEventBase;
    writeProgress: AutoBeProgressEventBase;
    correctProgress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeTransformerFunction[]> {
  const plans: AutoBeRealizeTransformerPlan[] =
    await orchestrateRealizeTransformerPlan(ctx, {
      progress: props.planProgress,
    });
  const writes: AutoBeRealizeTransformerFunction[] =
    await orchestrateRealizeTransformerWrite(ctx, {
      plans,
      progress: props.writeProgress,
    });
  return await orchestrateRealizeCorrectCasting(ctx, {
    programmer: {
      template: (func) =>
        AutoBeRealizeTransformerProgrammer.getTemplate(func.plan),
      replaceImportStatements: (next) =>
        AutoBeRealizeTransformerProgrammer.replaceImportStatements(ctx, {
          dtoTypeName: next.function.plan.dtoTypeName,
          schemas: ctx.state().interface!.document.components.schemas,
          code: next.code,
        }),
      additional: () => ({}),
    },
    functions: writes,
    progress: props.correctProgress,
  });
}

async function makeOperations<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    authorizations: AutoBeRealizeAuthorization[];
    collectors: AutoBeRealizeCollectorFunction[];
    transformers: AutoBeRealizeTransformerFunction[];
    writeProgress: AutoBeProgressEventBase;
    correctProgress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeOperationFunction[]> {
  const document: AutoBeOpenApi.IDocument = ctx.state().interface!.document;
  const writes: AutoBeRealizeOperationFunction[] =
    await orchestrateRealizeOperationWrite(ctx, {
      authorizations: props.authorizations,
      collectors: props.collectors,
      transformers: props.transformers,
      progress: props.writeProgress,
    });
  const castings: AutoBeRealizeOperationFunction[] =
    await orchestrateRealizeCorrectCasting(ctx, {
      programmer: {
        template: (func) =>
          AutoBeRealizeOperationProgrammer.getTemplate({
            authorizations: props.authorizations,
            schemas: document.components.schemas,
            operation: document.operations.find(
              (o) =>
                o.method === func.endpoint.method &&
                o.path === func.endpoint.path,
            )!,
          }),
        replaceImportStatements: async (next) => {
          const scenario: IAutoBeRealizeScenarioResult =
            AutoBeRealizeOperationProgrammer.getScenario({
              authorizations: props.authorizations,
              operation: document.operations.find(
                (o) =>
                  o.method === next.function.endpoint.method &&
                  o.path === next.function.endpoint.path,
              )!,
            });
          return await AutoBeRealizeOperationProgrammer.replaceImportStatements(
            ctx,
            {
              operation: scenario.operation,
              schemas: document.components.schemas,
              code: next.code,
              decoratorType: scenario.decoratorEvent?.decorator.name,
            },
          );
        },
        additional: (functions) =>
          AutoBeRealizeOperationProgrammer.getAdditional({
            authorizations: props.authorizations,
            collectors: props.collectors,
            transformers: props.transformers,
            functions,
          }),
      },
      functions: writes,
      progress: props.correctProgress,
    });
  return castings;
}
