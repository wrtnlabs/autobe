import {
  AutoBeAssistantMessageHistory,
  AutoBePrisma,
  AutoBePrismaCompleteEvent,
  AutoBePrismaComponentsEvent,
  AutoBePrismaHistory,
  AutoBePrismaReviewEvent,
  IAutoBeCompiler,
  IAutoBePrismaValidation,
} from "@autobe/interface";
import { AutoBePrismaSchemasEvent } from "@autobe/interface/src/events/AutoBePrismaSchemasEvent";
import { ILlmSchema } from "@samchon/openapi";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeApplicationProps } from "../../context/IAutoBeApplicationProps";
import { predicateStateMessage } from "../../utils/predicateStateMessage";
import { orchestratePrismaComponents } from "./orchestratePrismaComponent";
import { orchestratePrismaCorrect } from "./orchestratePrismaCorrect";
import { orchestratePrismaReview } from "./orchestratePrismaReview";
import { orchestratePrismaSchemas } from "./orchestratePrismaSchemas";

export const orchestratePrisma = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: IAutoBeApplicationProps,
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
  const componentEvent: AutoBePrismaComponentsEvent =
    await orchestratePrismaComponents(ctx, props.instruction);
  ctx.dispatch(componentEvent);

  // CONSTRUCT AST DATA
  const schemaEvents: AutoBePrismaSchemasEvent[] =
    await orchestratePrismaSchemas(
      ctx,
      props.instruction,
      componentEvent.components,
    );
  const application: AutoBePrisma.IApplication = {
    files: schemaEvents.map((e) => e.file),
  };

  // REVIEW
  const compiler: IAutoBeCompiler = await ctx.compiler();
  const reviewSchemas: Record<string, string> = await compiler.prisma.write(
    application,
    "postgres",
  );
  const reviewEvents: AutoBePrismaReviewEvent[] = await orchestratePrismaReview(
    ctx,
    application,
    reviewSchemas,
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
  const finalSchemas: Record<string, string> = await compiler.prisma.write(
    result.data,
    "postgres",
  );

  // PROPAGATE
  return ctx.dispatch({
    type: "prismaComplete",
    id: v7(),
    result,
    schemas: finalSchemas,
    compiled: await compiler.prisma.compile({
      files: finalSchemas,
    }),
    step: ctx.state().analyze?.step ?? 0,
    elapsed: new Date().getTime() - start.getTime(),
    created_at: new Date().toISOString(),
  } satisfies AutoBePrismaCompleteEvent);
};
