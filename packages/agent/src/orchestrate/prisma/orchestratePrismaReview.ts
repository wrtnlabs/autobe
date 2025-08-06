import { IAgenticaController, MicroAgentica } from "@agentica/core";
import { AutoBePrisma } from "@autobe/interface";
import { AutoBePrismaReviewEvent } from "@autobe/interface/src/events/AutoBePrismaReviewEvent";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { enforceToolCall } from "../../utils/enforceToolCall";
import { forceRetry } from "../../utils/forceRetry";
import { transformPrismaReviewHistories } from "./histories/transformPrismaReviewHistories";
import { IAutoBePrismaReviewApplication } from "./structures/IAutoBePrismaReviewApplication";

export async function orchestratePrismaReview<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  application: AutoBePrisma.IApplication,
  schemas: Record<string, string>,
  components: AutoBePrisma.IComponent[],
): Promise<AutoBePrismaReviewEvent[]> {
  const total = components.length;
  let completed = 0;
  
  return await Promise.all(
    components.map(async (component) => {
      const event = await forceRetry(
        () => step(ctx, application, schemas, component, ++completed, total),
      );
      return event;
    }),
  );
}

async function step<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  application: AutoBePrisma.IApplication,
  schemas: Record<string, string>,
  component: AutoBePrisma.IComponent,
  completed: number,
  total: number,
): Promise<AutoBePrismaReviewEvent> {
  const start: Date = new Date();
  const pointer: IPointer<IAutoBePrismaReviewApplication.IProps | null> = {
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
    },
    histories: transformPrismaReviewHistories(application, schemas, component),
    controllers: [
      createApplication(ctx, {
        build: (next) => {
          pointer.value = next;
        },
      }),
    ],
  });
  enforceToolCall(agentica);

  await agentica
    .conversate("Please review the Prisma schema file.")
    .finally(() => {
      const tokenUsage = agentica.getTokenUsage().aggregate;
      ctx.usage().record(tokenUsage, ["prisma"]);
    });
  if (pointer.value === null)
    throw new Error("Failed to review the Prisma schema.");

  const event: AutoBePrismaReviewEvent = {
    type: "prismaReview",
    created_at: start.toISOString(),
    filename: component.filename,
    review: pointer.value.review,
    plan: pointer.value.plan,
    modifications: pointer.value.modifications,
    completed,
    total,
    step: ctx.state().analyze?.step ?? 0,
  };

  ctx.dispatch(event);
  return event;
}

function createApplication<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    build: (next: IAutoBePrismaReviewApplication.IProps) => void;
  },
): IAgenticaController.IClass<Model> {
  assertSchemaModel(ctx.model);

  const application: ILlmApplication<Model> = collection[
    ctx.model
  ] satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>;

  return {
    protocol: "class",
    name: "Prisma Schema Review",
    application,
    execute: {
      reviewSchemaFile: (next) => {
        props.build(next);
      },
    } satisfies IAutoBePrismaReviewApplication,
  };
}

const claude = typia.llm.application<
  IAutoBePrismaReviewApplication,
  "claude",
  { reference: true }
>();

const collection = {
  chatgpt: typia.llm.application<
    IAutoBePrismaReviewApplication,
    "chatgpt",
    { reference: true }
  >(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};
