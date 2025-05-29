import {
  AutoBeAssistantMessageHistory,
  AutoBePrismaComponentsEvent,
  AutoBePrismaHistory,
} from "@autobe/interface";
import { AutoBePrismaSchemasEvent } from "@autobe/interface/src/events/AutoBePrismaSchemasEvent";
import { ILlmSchema } from "@samchon/openapi";
import { v4 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeApplicationProps } from "../../context/IAutoBeApplicationProps";
import { orchestratePrismaCompiler } from "./orchestratePrismaCompiler";
import { orchestratePrismaComponents } from "./orchestratePrismaComponent";
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

    // COMPILER
    const files: Record<string, string> = Object.fromEntries(
      events.map((e) => [e.filename, e.content]),
    );

    const result = await orchestratePrismaCompiler(ctx, files);
    const history: AutoBePrismaHistory = {
      type: "prisma",
      id: v4(),
      created_at: start.toISOString(),
      completed_at: new Date().toISOString(),
      reason: props.reason,
      description: "",
      result: result,
      step: ctx.state().analyze?.step ?? 0,
    };
    ctx.state().prisma = history;
    ctx.histories().push(history);

    if (result.type === "success")
      ctx.dispatch({
        type: "prismaComplete",
        schemas: result.schemas,
        document: result.document,
        diagrams: result.diagrams,
        step: ctx.state().analyze?.step ?? 0,
        created_at: new Date().toISOString(),
      });
    return history;
  };
