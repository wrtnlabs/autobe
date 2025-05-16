import { MicroAgentica, MicroAgenticaHistory } from "@agentica/core";
import {
  AutoBeAssistantMessageHistory,
  AutoBeInterfaceHistory,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import { v4 } from "uuid";

import { AutoBeSystemPrompt } from "../../constants/AutoBeSystemPrompt";
import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeApplicationProps } from "../../context/IAutoBeApplicationProps";
import { createAutoBeInterfaceApplication } from "./createAutoBeInterfaceApplication";
import { transformInterfaceStateMessage } from "./transformInterfaceStateMessage";

export const orchestrateInterface =
  <Model extends ILlmSchema.Model>(ctx: AutoBeContext<Model>) =>
  async (
    props: IAutoBeApplicationProps,
  ): Promise<AutoBeAssistantMessageHistory | AutoBeInterfaceHistory> => {
    const start: Date = new Date();
    const result: IPointer<AutoBeInterfaceHistory | null> = {
      value: null,
    };
    const agentica: MicroAgentica<Model> = new MicroAgentica({
      model: ctx.model,
      vendor: ctx.vendor,
      config: {
        ...(ctx.config ?? {}),
        executor: {
          describe: null,
        },
        systemPrompt: {
          execute: () => AutoBeSystemPrompt.INTERFACE,
        },
      },
      controllers: [
        createAutoBeInterfaceApplication({
          model: ctx.model,
          build: async (next) => {
            result.value = {
              id: v4(),
              type: "interface",
              document: next.document,
              reason: props.reason,
              description: next.description,
              started_at: start.toISOString(),
              completed_at: new Date().toISOString(),
              step: ctx.state().analyze!.step,
            } satisfies AutoBeInterfaceHistory;
          },
        }),
      ],
      histories: [transformInterfaceStateMessage(ctx.state())],
    });
    agentica.on("validate", (e) => {
      console.log("validate", e);
    });

    const histories: MicroAgenticaHistory<Model>[] = await agentica.conversate(
      "Make an OpenAPI document please.",
    );
    ctx.usage().increment(agentica.getTokenUsage());
    if (result.value !== null) return result.value;

    const last: MicroAgenticaHistory<Model> = histories[histories.length - 1]!;
    if (last.type !== "assistantMessage") {
      // never be happened
      throw new Error("Unexpected type of last message from MicroAgentica.");
    }
    return {
      id: v4(),
      type: "assistantMessage",
      text: last.text,
      started_at: start.toISOString(),
      completed_at: new Date().toISOString(),
    } satisfies AutoBeAssistantMessageHistory;
  };
