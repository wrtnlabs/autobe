import {
  AutoBeAssistantMessageHistory,
  AutoBeDatabase,
  AutoBeDatabaseCompleteEvent,
  AutoBeDatabaseComponent,
  AutoBeDatabaseComponentEvent,
  AutoBeDatabaseComponentReviewEvent,
  AutoBeDatabaseHistory,
  AutoBeDatabaseReviewEvent,
  AutoBeDatabaseSchemaEvent,
  IAutoBeCompiler,
  IAutoBeDatabaseValidation,
} from "@autobe/interface";
import { writePrismaApplication } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { predicateStateMessage } from "../../utils/predicateStateMessage";
import { IAutoBeFacadeApplicationProps } from "../facade/histories/IAutoBeFacadeApplicationProps";
import { orchestratePrismaComponents } from "./orchestratePrismaComponent";
import { orchestratePrismaComponentReview } from "./orchestratePrismaComponentReview";
import { orchestratePrismaCorrect } from "./orchestratePrismaCorrect";
import { orchestratePrismaReview } from "./orchestratePrismaReview";
import { orchestratePrismaSchema } from "./orchestratePrismaSchema";

export const orchestratePrisma = async (
  ctx: AutoBeContext,
  props: IAutoBeFacadeApplicationProps,
): Promise<AutoBeDatabaseHistory | AutoBeAssistantMessageHistory> => {
  // PREDICATION
  const start: Date = new Date();
  const predicate: string | null = predicateStateMessage(
    ctx.state(),
    "database",
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
    type: "databaseStart",
    id: v7(),
    created_at: start.toISOString(),
    reason: props.instruction,
    step: ctx.state().analyze?.step ?? 0,
  });

  // COMPONENTS
  const componentEvent: AutoBeDatabaseComponentEvent =
    await orchestratePrismaComponents(ctx, props.instruction);
  ctx.dispatch(componentEvent);

  // COMPONENT REVIEW (each event is dispatched inside)
  const componentReviewEvents: AutoBeDatabaseComponentReviewEvent[] =
    await orchestratePrismaComponentReview(ctx, {
      instruction: props.instruction,
      components: componentEvent.components,
    });

  // Extract reviewed components from all events
  const finalComponents: AutoBeDatabaseComponent[] = componentReviewEvents.map(
    (e) => e.modification,
  );

  // CONSTRUCT AST DATA
  const schemaEvents: AutoBeDatabaseSchemaEvent[] =
    await orchestratePrismaSchema(ctx, props.instruction, finalComponents);
  const application: AutoBeDatabase.IApplication = {
    files: finalComponents.map((comp) => ({
      filename: comp.filename,
      namespace: comp.namespace,
      models: schemaEvents
        .filter((se) => se.namespace === comp.namespace)
        .map((se) => se.model),
    })),
  };

  // REVIEW
  const reviewEvents: AutoBeDatabaseReviewEvent[] =
    await orchestratePrismaReview(ctx, application, finalComponents);
  for (const event of reviewEvents) {
    if (event.content === null) continue;

    const model: AutoBeDatabase.IModel = event.content;
    const file: AutoBeDatabase.IFile | undefined = application.files.find(
      (f) => f.namespace === event.namespace,
    );
    if (file === undefined) continue;

    const index: number = file.models.findIndex((m) => m.name === model.name);
    if (index !== -1) file.models[index] = model;
  }

  // VALIDATE
  const result: IAutoBeDatabaseValidation = await orchestratePrismaCorrect(
    ctx,
    application,
  );
  const finalSchemas: Record<string, string> = writePrismaApplication({
    dbms: "postgres",
    application: result.data,
  });

  // PROPAGATE
  const compiler: IAutoBeCompiler = await ctx.compiler();
  return ctx.dispatch({
    type: "databaseComplete",
    id: v7(),
    result,
    schemas: finalSchemas,
    compiled: await compiler.database.compilePrismaSchemas({
      files: finalSchemas,
    }),
    aggregates: ctx.getCurrentAggregates("database"),
    step: ctx.state().analyze?.step ?? 0,
    elapsed: new Date().getTime() - start.getTime(),
    created_at: new Date().toISOString(),
  } satisfies AutoBeDatabaseCompleteEvent);
};
