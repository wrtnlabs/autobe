import {
  AutoBeAssistantMessageHistory,
  AutoBePrismaCompleteEvent,
  AutoBePrismaComponentsEvent,
  AutoBePrismaHistory,
  IAutoBeCompiler,
  IAutoBePrismaValidation,
} from "@autobe/interface";
import { AutoBePrismaSchemasEvent } from "@autobe/interface/src/events/AutoBePrismaSchemasEvent";
import { ILlmSchema } from "@samchon/openapi";

import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeApplicationProps } from "../../context/IAutoBeApplicationProps";
import { orchestratePrismaComponents } from "./orchestratePrismaComponent";
import { orchestratePrismaCorrect } from "./orchestratePrismaCorrect";
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
  const components:
    | AutoBeAssistantMessageHistory
    | AutoBePrismaComponentsEvent = await orchestratePrismaComponents(ctx);
  if (components.type === "assistantMessage")
    return ctx.assistantMessage(components);
  else ctx.dispatch(components);

  // CONSTRUCT AST DATA
  const events: AutoBePrismaSchemasEvent[] = await orchestratePrismaSchemas(
    ctx,
    components.components,
  );

  // VALIDATE
  const result: IAutoBePrismaValidation = await orchestratePrismaCorrect(ctx, {
    files: events.map((e) => e.file),
  });

  // COMPILE
  const compiler: IAutoBeCompiler = await ctx.compiler();
  const schemas: Record<string, string> = await compiler.prisma.write(
    result.data,
    "postgres",
  );

  // PROPAGATE
  return ctx.dispatch({
    type: "prismaComplete",
    result,
    schemas,
    compiled: await compiler.prisma.compile({
      files: schemas,
    }),
    step: ctx.state().analyze?.step ?? 0,
    created_at: new Date().toISOString(),
  } satisfies AutoBePrismaCompleteEvent);
};
