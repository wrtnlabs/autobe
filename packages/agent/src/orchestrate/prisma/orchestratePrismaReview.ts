import { IAgenticaController } from "@agentica/core";
import { AutoBePrisma, AutoBeProgressEventBase } from "@autobe/interface";
import { AutoBePrismaReviewEvent } from "@autobe/interface/src/events/AutoBePrismaReviewEvent";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { transformPrismaReviewHistories } from "./histories/transformPrismaReviewHistories";
import { IAutoBePrismaReviewApplication } from "./structures/IAutoBePrismaReviewApplication";

export async function orchestratePrismaReview<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  application: AutoBePrisma.IApplication,
  schemas: Record<string, string>,
  componentList: AutoBePrisma.IComponent[],
): Promise<AutoBePrismaReviewEvent[]> {
  const progress: AutoBeProgressEventBase = {
    completed: 0,
    total: componentList.length,
  };
  const id: string = v7();
  return (
    await executeCachedBatch(
      componentList.map((component) => async () => {
        try {
          return await step(ctx, application, schemas, component, progress, id);
        } catch {
          ++progress.completed;
          return null;
        }
      }),
    )
  ).filter((v) => v !== null);
}

async function step<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  application: AutoBePrisma.IApplication,
  schemas: Record<string, string>,
  component: AutoBePrisma.IComponent,
  progress: AutoBeProgressEventBase,
  id: string,
): Promise<AutoBePrismaReviewEvent> {
  const start: Date = new Date();
  const pointer: IPointer<IAutoBePrismaReviewApplication.IProps | null> = {
    value: null,
  };
  const { tokenUsage } = await ctx.conversate({
    source: "prismaReview",
    histories: transformPrismaReviewHistories({
      analysis:
        ctx
          .state()
          .analyze?.files.map((file) => ({ [file.filename]: file.content }))
          .reduce((acc, cur) => {
            return Object.assign(acc, cur);
          }, {}) ?? {},
      application,
      schemas,
      component,
    }),
    controller: createController(ctx, {
      build: (next) => {
        pointer.value = next;
      },
    }),
    enforceFunctionCall: true,
    message: "Please review the Prisma schema file.",
  });
  if (pointer.value === null)
    throw new Error("Failed to review the Prisma schema.");

  const event: AutoBePrismaReviewEvent = {
    type: "prismaReview",
    id,
    created_at: start.toISOString(),
    filename: component.filename,
    review: pointer.value.review,
    plan: pointer.value.plan,
    modifications: pointer.value.modifications,
    tokenUsage,
    completed: ++progress.completed,
    total: progress.total,
    step: ctx.state().analyze?.step ?? 0,
  };
  ctx.dispatch(event);
  return event;
}

function createController<Model extends ILlmSchema.Model>(
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
  "claude"
>();

const collection = {
  chatgpt: typia.llm.application<IAutoBePrismaReviewApplication, "chatgpt">(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};
