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
import { NamingConvention } from "typia/lib/utils/NamingConvention";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { predicateStateMessage } from "../../utils/predicateStateMessage";
import { IAutoBeFacadeApplicationProps } from "../facade/histories/IAutoBeFacadeApplicationProps";
import { orchestratePrismaAuthorization } from "./orchestratePrismaAuthorization";
import { orchestratePrismaAuthorizationReview } from "./orchestratePrismaAuthorizationReview";
import { orchestratePrismaComponent } from "./orchestratePrismaComponent";
import { orchestratePrismaComponentReview } from "./orchestratePrismaComponentReview";
import { orchestratePrismaCorrect } from "./orchestratePrismaCorrect";
import { orchestratePrismaDeduplication } from "./orchestratePrismaDeduplication";
import { orchestratePrismaGroup } from "./orchestratePrismaGroup";
import { orchestratePrismaGroupReview } from "./orchestratePrismaGroupReview";
import { orchestratePrismaSchema } from "./orchestratePrismaSchema";
import { orchestratePrismaSchemaReview } from "./orchestratePrismaSchemaReview";
import { AutoBeDatabaseComponentProgrammer } from "./programmers/AutoBeDatabaseComponentProgrammer";

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

  // NORMALIZE PREFIX
  const analyze = ctx.state().analyze;
  if (analyze?.prefix) {
    analyze.prefix = NamingConvention.snake(analyze.prefix);
  }

  // GROUPS
  const groups: AutoBeDatabaseGroup[] = await orchestratePrismaGroup(
    ctx,
    props.instruction,
  );
  const reviewedGroups: AutoBeDatabaseGroup[] =
    await orchestratePrismaGroupReview(ctx, {
      instruction: props.instruction,
      groups,
    });

  // AUTHORIZATION
  const authorizations: AutoBeDatabaseComponent[] =
    await orchestratePrismaAuthorization(ctx, {
      instruction: props.instruction,
      groups: reviewedGroups,
    });
  console.log(`----------- PRISMA AUTHORIZATION -----------`);
  console.log(JSON.stringify(authorizations, null, 2));

  const reviewedAuthorizations: AutoBeDatabaseComponent[] =
    await orchestratePrismaAuthorizationReview(ctx, {
      instruction: props.instruction,
      components: authorizations,
    });
  console.log(`----------- PRISMA AUTHORIZATION REVIEW -----------`);
  console.log(JSON.stringify(reviewedAuthorizations, null, 2));

  // COMPONENT
  const components: AutoBeDatabaseComponent[] =
    await orchestratePrismaComponent(ctx, {
      instruction: props.instruction,
      groups: reviewedGroups,
    });
  console.log(`----------- PRISMA COMPONENT -----------`);
  console.log(JSON.stringify(components, null, 2));

  const reviewedComponents: AutoBeDatabaseComponent[] =
    await orchestratePrismaComponentReview(ctx, {
      instruction: props.instruction,
      components,
    });
  console.log(`----------- PRISMA COMPONENT REVIEW -----------`);
  console.log(JSON.stringify(reviewedComponents, null, 2));

  const reviewedAllComponents: AutoBeDatabaseComponent[] =
    AutoBeDatabaseComponentProgrammer.removeDuplicatedTable([
      ...reviewedAuthorizations,
      ...reviewedComponents,
    ]);

  // DEDUPLICATION (semantic)
  const deduplicatedComponents: AutoBeDatabaseComponent[] =
    await orchestratePrismaDeduplication(ctx, {
      instruction: props.instruction,
      components: reviewedAllComponents,
    });
  console.log(`----------- PRISMA DEDUPLICATION -----------`);
  console.log(JSON.stringify(deduplicatedComponents, null, 2));
  console.log(
    `before Tables: ${reviewedAllComponents.flatMap((c) => c.tables).length}`,
  );
  console.log(
    `after Tables: ${deduplicatedComponents.flatMap((c) => c.tables).length}`,
  );

  // CONSTRUCT AST DATA
  const schemaEvents: AutoBeDatabaseSchemaEvent[] =
    await orchestratePrismaSchema(
      ctx,
      props.instruction,
      deduplicatedComponents,
    );
  const application: AutoBeDatabase.IApplication = {
    files: deduplicatedComponents.map((comp) => ({
      filename: comp.filename,
      namespace: comp.namespace,
      models: schemaEvents
        .filter((se) => se.namespace === comp.namespace)
        .map((se) => se.model),
    })),
  };

  // REVIEW
  const reviewEvents: AutoBeDatabaseSchemaReviewEvent[] =
    await orchestratePrismaSchemaReview(
      ctx,
      application,
      deduplicatedComponents,
    );
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
