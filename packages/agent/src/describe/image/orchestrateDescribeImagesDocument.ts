import {
  IAgenticaController,
  IAgenticaTokenUsageJson,
  MicroAgentica,
} from "@agentica/core";
import {
  AutoBeDescribeImageDocumentEvent,
  AutoBeDescribeImageDraftIntegrationEvent,
} from "@autobe/interface";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { supportMistral } from "../../factory/supportMistral";
import { transformDescribeImagesDocumentHistories } from "./histories/transformDescribeImagesDocumentHistories";
import { IAutoBeDescribeImagesDocumentApplication } from "./structures/IAutoBeDescribeImagesDocumentApplication";

export const orchestrateDescribeImagesDocument = async <
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  props: {
    integrations: AutoBeDescribeImageDraftIntegrationEvent[];
  },
): Promise<AutoBeDescribeImageDocumentEvent> => {
  const pointer: IPointer<IAutoBeDescribeImagesDocumentApplication.IProps | null> =
    {
      value: null,
    };

  const { histories, userMessage } = transformDescribeImagesDocumentHistories({
    integrations: props.integrations,
  });

  const agent: MicroAgentica<Model> = new MicroAgentica<Model>({
    model: ctx.model,
    vendor: ctx.vendor,
    config: {
      executor: {
        describe: false,
      },
      retry: ctx.retry,
    },
    histories,
    controllers: [
      createController({
        model: ctx.model,
        build: (next) => {
          pointer.value = next;
        },
      }),
    ],
  });
  supportMistral(agent, {
    api: ctx.vendor.api,
    model: ctx.vendor.model,
    options: ctx.vendor.options,
    semaphore:
      typeof ctx.vendor.semaphore === "number"
        ? ctx.vendor.semaphore
        : ctx.vendor.semaphore?.max(),
  });
  await agent.conversate(userMessage);
  const tokenUsage: IAgenticaTokenUsageJson.IComponent = agent
    .getTokenUsage()
    .toJSON().aggregate;
  if (pointer.value === null)
    throw new Error("Failed to complete the requirements document");

  const event: AutoBeDescribeImageDocumentEvent = {
    type: "describeImageDocument",
    id: v7(),
    document: pointer.value.document,
    summary: pointer.value.summary,
    sections: pointer.value.sections,
    tokenUsage,
    created_at: new Date().toISOString(),
  };
  ctx.dispatch(event);

  return event;
};

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (next: IAutoBeDescribeImagesDocumentApplication.IProps) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const validate: Validator = (next: unknown) => {
    const result: IValidation<IAutoBeDescribeImagesDocumentApplication.IProps> =
      typia.validate<IAutoBeDescribeImagesDocumentApplication.IProps>(next);
    if (result.success === false) return result;
    return result;
  };

  const application: ILlmApplication<Model> = collection[
    props.model === "chatgpt"
      ? "chatgpt"
      : props.model === "gemini"
        ? "gemini"
        : "claude"
  ](
    validate,
  ) satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: "complete",
    application,
    execute: {
      completeDocument: (next) => {
        props.build(next);
      },
    } satisfies IAutoBeDescribeImagesDocumentApplication,
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBeDescribeImagesDocumentApplication, "chatgpt">({
      validate: {
        completeDocument: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBeDescribeImagesDocumentApplication, "claude">({
      validate: {
        completeDocument: validate,
      },
    }),
  gemini: (validate: Validator) =>
    typia.llm.application<IAutoBeDescribeImagesDocumentApplication, "gemini">({
      validate: {
        completeDocument: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeDescribeImagesDocumentApplication.IProps>;
