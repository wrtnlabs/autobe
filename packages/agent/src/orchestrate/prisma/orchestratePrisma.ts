import {
  AutoBeAssistantMessageHistory,
  AutoBePrisma,
  AutoBePrismaCompleteEvent,
  AutoBePrismaComponentEvent,
  AutoBePrismaHistory,
  AutoBePrismaReviewEvent,
  AutoBePrismaSchemaEvent,
  IAutoBeCompiler,
  IAutoBePrismaValidation,
} from "@autobe/interface";
import { writePrismaApplication } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { predicateStateMessage } from "../../utils/predicateStateMessage";
import { IAutoBeFacadeApplicationProps } from "../facade/histories/IAutoBeFacadeApplicationProps";
import { orchestratePrismaComponents } from "./orchestratePrismaComponent";
import { orchestratePrismaCorrect } from "./orchestratePrismaCorrect";
import { orchestratePrismaReview } from "./orchestratePrismaReview";
import { orchestratePrismaSchema } from "./orchestratePrismaSchema";

export const orchestratePrisma = async (
  ctx: AutoBeContext,
  props: IAutoBeFacadeApplicationProps,
): Promise<AutoBePrismaHistory | AutoBeAssistantMessageHistory> => {
  // PREDICATION
  const start: Date = new Date();
  const predicate: string | null = predicateStateMessage(ctx.state(), "prisma");
  if (predicate !== null)
    return ctx.assistantMessage({
      type: "assistantMessage",
      id: v7(),
      created_at: start.toISOString(),
      text: predicate,
      completed_at: new Date().toISOString(),
    });
  ctx.dispatch({
    type: "prismaStart",
    id: v7(),
    created_at: start.toISOString(),
    reason: props.instruction,
    step: ctx.state().analyze?.step ?? 0,
  });

  // COMPONENTS
  const componentEvent: AutoBePrismaComponentEvent =
    await orchestratePrismaComponents(ctx, props.instruction);
  ctx.dispatch(componentEvent);

  // CONSTRUCT AST DATA
  const schemaEvents: AutoBePrismaSchemaEvent[] = await orchestratePrismaSchema(
    ctx,
    props.instruction,
    componentEvent.components,
  );
  const application: AutoBePrisma.IApplication = {
    files: schemaEvents.map((e) => e.file),
  };

  // REVIEW
  const reviewEvents: AutoBePrismaReviewEvent[] = await orchestratePrismaReview(
    ctx,
    application,
    componentEvent.components,
  );
  for (const event of reviewEvents) {
    const file: AutoBePrisma.IFile | undefined = application.files.find(
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
  const result: IAutoBePrismaValidation = await orchestratePrismaCorrect(
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
    type: "prismaComplete",
    id: v7(),
    result,
    schemas: finalSchemas,
    compiled: await compiler.prisma.compile({
      files: finalSchemas,
    }),
    aggregates: ctx.getCurrentAggregates("prisma"),
    step: ctx.state().analyze?.step ?? 0,
    elapsed: new Date().getTime() - start.getTime(),
    created_at: new Date().toISOString(),
  } satisfies AutoBePrismaCompleteEvent);
};
