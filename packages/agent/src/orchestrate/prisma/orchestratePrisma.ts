import {
  AutoBeAssistantMessageHistory,
  AutoBeDatabase,
  AutoBeDatabaseCompleteEvent,
  AutoBeDatabaseComponent,
  AutoBeDatabaseGroup,
  AutoBeDatabaseHistory,
  AutoBeDatabaseSchemaEvent,
  AutoBeDatabaseSchemaReviewEvent,
  IAutoBeCompiler,
  IAutoBeDatabaseValidation,
} from "@autobe/interface";
import { writePrismaApplication } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { predicateStateMessage } from "../../utils/predicateStateMessage";
import { IAutoBeFacadeApplicationProps } from "../facade/histories/IAutoBeFacadeApplicationProps";
import { orchestratePrismaComponent } from "./orchestratePrismaComponent";
import { orchestratePrismaComponentReview } from "./orchestratePrismaComponentReview";
import { orchestratePrismaCorrect } from "./orchestratePrismaCorrect";
import { orchestratePrismaGroup } from "./orchestratePrismaGroup";
import { orchestratePrismaSchema } from "./orchestratePrismaSchema";
import { orchestratePrismaSchemaReview } from "./orchestratePrismaSchemaReview";

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

  // GROUPS
  const groups: AutoBeDatabaseGroup[] = await orchestratePrismaGroup(
    ctx,
    props.instruction,
  );
  const components: AutoBeDatabaseComponent[] =
    await orchestratePrismaComponent(ctx, {
      instruction: props.instruction,
      groups,
    });

  // COMPONENT REVIEW (each event is dispatched inside)
  const reviewedComponents: AutoBeDatabaseComponent[] =
    await orchestratePrismaComponentReview(ctx, {
      instruction: props.instruction,
      components,
    });

  // CONSTRUCT AST DATA
  const schemaEvents: AutoBeDatabaseSchemaEvent[] =
    await orchestratePrismaSchema(ctx, props.instruction, reviewedComponents);
  const application: AutoBeDatabase.IApplication = {
    files: reviewedComponents.map((comp) => ({
      filename: comp.filename,
      namespace: comp.namespace,
      models: schemaEvents
        .filter((se) => se.namespace === comp.namespace)
        .map((se) => se.model),
    })),
  };

  // REVIEW
  const reviewEvents: AutoBeDatabaseSchemaReviewEvent[] =
    await orchestratePrismaSchemaReview(ctx, application, reviewedComponents);
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
  const prismaSchemaFiles: Record<string, string> = writePrismaApplication({
    dbms: "postgres",
    application: result.data,
  });

  // PROPAGATE
  const compiler: IAutoBeCompiler = await ctx.compiler();
  return ctx.dispatch({
    type: "databaseComplete",
    id: v7(),
    result,
    schemas: prismaSchemaFiles,
    compiled: await compiler.database.compilePrismaSchemas({
      files: prismaSchemaFiles,
    }),
    aggregates: ctx.getCurrentAggregates("database"),
    step: ctx.state().analyze?.step ?? 0,
    elapsed: new Date().getTime() - start.getTime(),
    created_at: new Date().toISOString(),
  } satisfies AutoBeDatabaseCompleteEvent);
};
