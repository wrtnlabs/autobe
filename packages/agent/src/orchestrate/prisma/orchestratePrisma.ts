import {
  AutoBeAssistantMessageHistory,
  AutoBeDatabase,
  AutoBeDatabaseCompleteEvent,
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
  const finalComponents: AutoBeDatabase.IComponent[] =
    componentReviewEvents.map((e) => e.modification);

  // CONSTRUCT AST DATA
  const schemaEvents: AutoBeDatabaseSchemaEvent[] =
    await orchestratePrismaSchema(ctx, props.instruction, finalComponents);
  const application: AutoBeDatabase.IApplication = {
    files: schemaEvents.map((e) => e.file),
  };

  // REVIEW
  const reviewEvents: AutoBeDatabaseReviewEvent[] =
    await orchestratePrismaReview(ctx, application, finalComponents);
  for (const event of reviewEvents) {
    const file: AutoBeDatabase.IFile | undefined = application.files.find(
      (f) => f.filename === event.filename,
    );
    if (file === undefined) continue;
    for (const modification of event.modifications) {
      const index: number = file.models.findIndex(
        (m) => m.name === modification.name,
      );
      if (index === -1) file.models.push(modification);
      else file.models[index] = modification;
    }
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
