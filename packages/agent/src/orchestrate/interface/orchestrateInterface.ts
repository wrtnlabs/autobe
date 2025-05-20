import { MicroAgentica, MicroAgenticaHistory } from "@agentica/core";
import {
  AutoBeAssistantMessageHistory,
  AutoBeInterfaceHistory,
} from "@autobe/interface";
import { MigrateApplication } from "@nestia/migrate";
import { ILlmSchema, IValidation, OpenApi } from "@samchon/openapi";
import { IPointer } from "tstl";
import { v4 } from "uuid";

import { AutoBeSystemPrompt } from "../../constants/AutoBeSystemPrompt";
// import examples from "../../constants/examples.json";
import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeApplicationProps } from "../../context/IAutoBeApplicationProps";
import { createOpenApiDocument } from "../../factory/createOpenApiDocument";
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
          // AutoBeSystemPrompt.INTERFACE.replace(W
          //   "%EXAMPLE_BBS_BACKEND%",
          //   JSON.stringify(examples.bbs),
          // ).replace(
          //   "%EXAMPLE_SHOPPING_BACKEND%",
          //   JSON.stringify(examples.shopping),
          // ),
        },
      },
      controllers: [
        createAutoBeInterfaceApplication({
          model: ctx.model,
          build: async (next) => {
            const swagger: OpenApi.IDocument = createOpenApiDocument(
              next.document,
            );
            const migrate: IValidation<MigrateApplication> =
              MigrateApplication.create(swagger);
            if (migrate.success === false) {
              // never be happened
              throw new Error("Failed to pass validation.");
            }
            result.value = {
              id: v4(),
              type: "interface",
              document: next.document,
              files: {
                "packages/api/swagger.json": JSON.stringify(swagger, null, 2),
                ...Object.fromEntries(
                  migrate.data
                    .nest({
                      simulate: true,
                      e2e: true,
                    })
                    .files.map((f) => [`${f.location}/${f.file}`, f.content]),
                ),
              },
              reason: props.reason,
              started_at: start.toISOString(),
              completed_at: new Date().toISOString(),
              step: ctx.state().analyze!.step,
            } satisfies AutoBeInterfaceHistory;
          },
        }),
      ],
      histories: [transformInterfaceStateMessage(ctx.state())],
      tokenUsage: ctx.usage(),
    });
    agentica.on("validate", (e) =>
      console.log("validation feedback", e.result.errors),
    );

    const histories: MicroAgenticaHistory<Model>[] = await agentica.conversate(
      "Make an OpenAPI document please.",
    );
    ctx.histories().push(
      ...histories
        .filter((h) => h.type === "assistantMessage")
        .map((h) => ({
          ...h,
          id: v4(),
          started_at: start.toISOString(),
          completed_at: new Date().toISOString(),
          step: ctx.state().analyze!.step,
        })),
    );
    if (result.value !== null) {
      ctx.state().interface = result.value;
      ctx.histories().push(result.value);
      return result.value;
    }

    const last: MicroAgenticaHistory<Model> = histories[histories.length - 1];
    if (last.type !== "execute" && last.type !== "assistantMessage") {
      // never be happened
      throw new Error("Unexpected type of last message from MicroAgentica.");
    }
    return {
      id: v4(),
      type: "assistantMessage",
      text:
        last.type === "assistantMessage"
          ? last.text
          : "Failed to pass validation. Try it again please.",
      started_at: start.toISOString(),
      completed_at: new Date().toISOString(),
    } satisfies AutoBeAssistantMessageHistory;
  };
