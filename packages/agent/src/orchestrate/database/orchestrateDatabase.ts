import {
  AutoBeAnalyzeHistory,
  AutoBeAssistantMessageHistory,
  AutoBeDatabase,
  AutoBeDatabaseCompleteEvent,
  AutoBeDatabaseComponent,
  AutoBeDatabaseComponentTableDesign,
  AutoBeDatabaseGroup,
  AutoBeDatabaseHistory,
  AutoBeDatabaseSchemaDefinition,
  AutoBeDatabaseSchemaEvent,
  AutoBeDatabaseSchemaReviewEvent,
  AutoBeProgressEventBase,
  IAutoBeCompiler,
  IAutoBeDatabaseValidation,
} from "@autobe/interface";
import { writePrismaApplication } from "@autobe/utils";
import { NamingConvention } from "@typia/utils";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { predicateStateMessage } from "../../utils/predicateStateMessage";
import { IAutoBeFacadeApplicationProps } from "../facade/histories/IAutoBeFacadeApplicationProps";
import { orchestrateDatabaseAuthorization } from "./orchestrateDatabaseAuthorization";
import { orchestrateDatabaseAuthorizationReview } from "./orchestrateDatabaseAuthorizationReview";
import { orchestrateDatabaseComponent } from "./orchestrateDatabaseComponent";
import { orchestrateDatabaseComponentReview } from "./orchestrateDatabaseComponentReview";
import { orchestrateDatabaseCorrect } from "./orchestrateDatabaseCorrect";
import { orchestrateDatabaseGroup } from "./orchestrateDatabaseGroup";
import { orchestrateDatabaseGroupReview } from "./orchestrateDatabaseGroupReview";
import { orchestrateDatabaseSchema } from "./orchestrateDatabaseSchema";
import { orchestrateDatabaseSchemaReview } from "./orchestrateDatabaseSchemaReview";

export const orchestrateDatabase = async (
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
  const analyze: AutoBeAnalyzeHistory | null = ctx.state().analyze;
  if (analyze?.prefix) {
    analyze.prefix = NamingConvention.snake(analyze.prefix);
  }

  // GROUPS
  const groups: AutoBeDatabaseGroup[] = await orchestrateGroup(ctx, props);
  const components: AutoBeDatabaseComponent[] = await orchestrateComponent(
    ctx,
    {
      groups,
      instruction: props.instruction,
    },
  );
  const application: AutoBeDatabase.IApplication = await orchestrateSchema(
    ctx,
    {
      instruction: props.instruction,
      components,
    },
  );

  // VALIDATE
  const validation: IAutoBeDatabaseValidation =
    await orchestrateDatabaseCorrect(ctx, application);
  const files: Record<string, string> = writePrismaApplication({
    dbms: "postgres",
    application: validation.data,
  });

  // PROPAGATE
  const compiler: IAutoBeCompiler = await ctx.compiler();
  return ctx.dispatch({
    type: "databaseComplete",
    id: v7(),
    result: validation,
    schemas: files,
    compiled: await compiler.database.compilePrismaSchemas({
      files,
    }),
    aggregates: ctx.getCurrentAggregates("database"),
    step: ctx.state().analyze?.step ?? 0,
    elapsed: new Date().getTime() - start.getTime(),
    created_at: new Date().toISOString(),
  } satisfies AutoBeDatabaseCompleteEvent);
};

const orchestrateGroup = async (
  ctx: AutoBeContext,
  props: IAutoBeFacadeApplicationProps,
): Promise<AutoBeDatabaseGroup[]> => {
  const groups: AutoBeDatabaseGroup[] = await orchestrateDatabaseGroup(
    ctx,
    props.instruction,
  );
  return await orchestrateDatabaseGroupReview(ctx, {
    instruction: props.instruction,
    groups,
  });
};

const orchestrateAuthorization = async (
  ctx: AutoBeContext,
  props: {
    instruction: string;
    groups: AutoBeDatabaseGroup[];
  },
): Promise<AutoBeDatabaseComponent | null> => {
  const authorization: AutoBeDatabaseComponent | null =
    await orchestrateDatabaseAuthorization(ctx, {
      instruction: props.instruction,
      groups: props.groups,
    });
  if (authorization === null) return null;

  const reviewed: AutoBeDatabaseComponent | null =
    await orchestrateDatabaseAuthorizationReview(ctx, {
      instruction: props.instruction,
      component: authorization,
    });
  return reviewed ?? authorization;
};

const orchestrateComponent = async (
  ctx: AutoBeContext,
  props: {
    instruction: string;
    groups: AutoBeDatabaseGroup[];
  },
): Promise<AutoBeDatabaseComponent[]> => {
  const authorization: AutoBeDatabaseComponent | null =
    await orchestrateAuthorization(ctx, {
      groups: props.groups,
      instruction: props.instruction,
    });
  const components: AutoBeDatabaseComponent[] =
    await orchestrateDatabaseComponent(ctx, {
      instruction: props.instruction,
      groups: props.groups,
    });
  return [
    ...(authorization ? [authorization] : []),
    ...(await orchestrateDatabaseComponentReview(ctx, {
      instruction: props.instruction,
      components,
    })),
  ];
};

const orchestrateSchema = async (
  ctx: AutoBeContext,
  props: {
    instruction: string;
    components: AutoBeDatabaseComponent[];
  },
): Promise<AutoBeDatabase.IApplication> => {
  //----
  // STATES
  //----
  // clone groups to keep previous events
  const components: AutoBeDatabaseComponent[] = props.components.map((c) => ({
    ...c,
    tables: c.tables.slice(),
  }));

  // completion set
  const reviewed: Set<string> = new Set();
  const written: Set<string> = new Set();
  const failed: Map<string, number> = new Map();
  const complete = () =>
    components
      .flatMap((g) => g.tables)
      .every((t) => written.has(t.name) === true);

  // generated models
  interface IModelPair {
    namespace: string;
    model: AutoBeDatabase.IModel;
  }
  const pairs: IModelPair[] = [];

  //----
  // DEFINER
  //----
  const application = (): AutoBeDatabase.IApplication => ({
    files: components.map((comp) => ({
      filename: comp.filename,
      namespace: comp.namespace,
      models: pairs
        .filter((p) => p.namespace === comp.namespace)
        .map((p) => p.model),
    })),
  });
  const define = (next: {
    namespace: string;
    definition: AutoBeDatabaseSchemaDefinition;
  }): void => {
    // find parent component and matched design
    const myComponent: AutoBeDatabaseComponent = components.find(
      (c) => c.namespace === next.namespace,
    )!;
    const myTable: AutoBeDatabaseComponentTableDesign = myComponent.tables.find(
      (t) => t.name === next.definition.model.name,
    )!;

    // mark as done
    written.add(myTable.name);
    const existing: number = pairs.findIndex(
      (p) =>
        p.namespace === next.namespace &&
        p.model.name === next.definition.model.name,
    );
    if (existing !== -1)
      pairs[existing] = {
        namespace: next.namespace,
        model: next.definition.model,
      };
    else
      pairs.push({ namespace: next.namespace, model: next.definition.model });

    // prepare new designs
    for (const design of next.definition.newDesigns)
      if (
        written.has(design.name) === false &&
        myComponent.tables.find((t) => t.name === design.name) === undefined &&
        components
          .flatMap((c) => c.tables)
          .find((t) => t.name === design.name) === undefined
      )
        myComponent.tables.push(design);
  };

  //----
  // THE LOOP
  //----
  const writeProgress: AutoBeProgressEventBase = { total: 0, completed: 0 };
  const reviewProgress: AutoBeProgressEventBase = { total: 0, completed: 0 };
  while (complete() === false) {
    do {
      const events: AutoBeDatabaseSchemaEvent[] =
        await orchestrateDatabaseSchema(ctx, {
          instruction: props.instruction,
          components,
          written,
          failed,
          progress: writeProgress,
        });
      for (const e of events)
        define({
          namespace: e.namespace,
          definition: e.definition,
        });
    } while (complete() === false);

    const events: AutoBeDatabaseSchemaReviewEvent[] =
      await orchestrateDatabaseSchemaReview(ctx, {
        application: application(),
        components,
        reviewed,
        progress: reviewProgress,
      });
    for (const e of events) {
      reviewed.add(e.modelName);
      if (e.content !== null)
        define({
          namespace: e.namespace,
          definition: e.content,
        });
    }
  }
  return application();
};
