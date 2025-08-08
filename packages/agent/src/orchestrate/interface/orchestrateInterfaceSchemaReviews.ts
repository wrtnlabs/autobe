import { IAgenticaController, MicroAgentica } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { enforceToolCall } from "../../utils/enforceToolCall";
import { transformInterfaceSchemaReviewHistories } from "./histories/transformInterfaceSchemaReviewHistories";
import { IAutoBeInterfaceSchemaReviewApplication } from "./structures/IAutoBeInterfaceSchemaReviewApplication";

export async function orchestrateInterfaceSChemaReviews<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  schemaDescriptive: Record<
    string,
    AutoBeOpenApi.IJsonSchemaDescriptive<AutoBeOpenApi.IJsonSchema>
  >,
) {
  const review = await process(ctx, schemaDescriptive);
  return review;
}

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  schemaDescriptive: Record<
    string,
    AutoBeOpenApi.IJsonSchemaDescriptive<AutoBeOpenApi.IJsonSchema>
  >,
) {
  const pointer: IPointer<
    IAutoBeInterfaceSchemaReviewApplication.IReview[] | null
  > = {
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
    histories: transformInterfaceSchemaReviewHistories(
      ctx.state(),
      schemaDescriptive,
    ),
    controllers: [
      createApplication({
        model: ctx.model,
        build: async (next) => {
          pointer.value = next;
        },
      }),
    ],
  });
  enforceToolCall(agentica);

  await agentica.conversate("Review about given schemas.").finally(() => {
    const tokenUsage = agentica.getTokenUsage().aggregate;
    ctx.usage().record(tokenUsage, ["interface"]);
  });

  if (pointer.value === null) {
    throw new Error("FAiled to review components");
  }

  return pointer.value;
}

function createApplication<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (
    next: IAutoBeInterfaceSchemaReviewApplication.IReview[],
  ) => Promise<void>;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const application: ILlmApplication<Model> = collection[
    props.model
  ] satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>;

  return {
    protocol: "class",
    name: "interface",
    application,
    execute: {
      review: async (next) => {
        await props.build(next.reviews);
      },
    } satisfies IAutoBeInterfaceSchemaReviewApplication,
  };
}

const claude = typia.llm.application<
  IAutoBeInterfaceSchemaReviewApplication,
  "claude",
  { reference: true }
>();

const collection = {
  chatgpt: typia.llm.application<
    IAutoBeInterfaceSchemaReviewApplication,
    "chatgpt",
    { reference: true }
  >(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};
