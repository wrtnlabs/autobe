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

import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeApplicationProps } from "../../context/IAutoBeApplicationProps";
import { orchestratePrismaComponents } from "./orchestratePrismaComponent";
import { orchestratePrismaCorrect } from "./orchestratePrismaCorrect";
import { orchestratePrismaReview } from "./orchestratePrismaReview";
import { orchestratePrismaSchemas } from "./orchestratePrismaSchemas";

export const orchestratePrisma = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: IAutoBeApplicationProps,
): Promise<AutoBePrismaHistory | AutoBeAssistantMessageHistory> => {
  const start: Date = new Date();
  ctx.dispatch({
    type: "prismaStart",
    created_at: start.toISOString(),
    reason: props.reason,
    step: ctx.state().analyze?.step ?? 0,
  });

  // COMPONENTS
  const componentEvent:
    | AutoBeAssistantMessageHistory
    | AutoBePrismaComponentsEvent = await orchestratePrismaComponents(ctx);
  if (componentEvent.type === "assistantMessage")
    return ctx.assistantMessage(componentEvent);
  else ctx.dispatch(componentEvent);

  // CONSTRUCT AST DATA
  const schemaEvents: AutoBePrismaSchemasEvent[] =
    await orchestratePrismaSchemas(ctx, componentEvent.components);
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
    result,
    schemas: finalSchemas,
    compiled: await compiler.prisma.compile({
      files: finalSchemas,
    }),
    step: ctx.state().analyze?.step ?? 0,
    created_at: new Date().toISOString(),
  } satisfies AutoBePrismaCompleteEvent);
};
