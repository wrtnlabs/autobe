import {
  AutoBeAssistantMessageHistory,
  AutoBePrismaCompleteEvent,
  AutoBePrismaComponentsEvent,
  AutoBePrismaHistory,
  IAutoBePrismaValidation,
} from "@autobe/interface";
import { AutoBePrismaSchemasEvent } from "@autobe/interface/src/events/AutoBePrismaSchemasEvent";
import { ILlmSchema } from "@samchon/openapi";
import { v4 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeApplicationProps } from "../../context/IAutoBeApplicationProps";
import { orchestratePrismaComponents } from "./orchestratePrismaComponent";
import { orchestratePrismaCorrect } from "./orchestratePrismaCorrect";
import { orchestratePrismaSchemas } from "./orchestratePrismaSchema";

export const orchestratePrisma =
  <Model extends ILlmSchema.Model>(ctx: AutoBeContext<Model>) =>
  async (
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
    if (components.type === "assistantMessage") {
      ctx.histories().push(components);
      ctx.dispatch(components);
      return components;
    } else ctx.dispatch(components);

    // SCHEMAS
    const events: AutoBePrismaSchemasEvent[] = await orchestratePrismaSchemas(
      ctx,
      components.components,
    );
    const result: IAutoBePrismaValidation = await orchestratePrismaCorrect(
      ctx,
      {
        files: events.map((e) => e.file),
      },
    );
    const schemas: Record<string, string> = await ctx.compiler.prisma.write(
      result.data,
    );
    const history: AutoBePrismaHistory = {
      type: "prisma",
      id: v4(),
      created_at: start.toISOString(),
      completed_at: new Date().toISOString(),
      reason: props.reason,
      description: "",
      result: result,
      schemas,
      compiled: await ctx.compiler.prisma.compile({
        files: schemas,
      }),
      step: ctx.state().analyze?.step ?? 0,
    };
    ctx.state().prisma = history;
    ctx.histories().push(history);

    if (history.result.success === true && history.compiled.type === "success")
      ctx.dispatch({
        type: "prismaComplete",
        application: history.result.data,
        schemas: history.schemas,
        compiled: history.compiled,
        step: ctx.state().analyze?.step ?? 0,
        created_at: new Date().toISOString(),
      } satisfies AutoBePrismaCompleteEvent);
    return history;
  };
