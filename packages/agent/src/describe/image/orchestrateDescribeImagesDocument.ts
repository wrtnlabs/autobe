import { IAgenticaController } from "@agentica/core";
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

  const { metric, tokenUsage } = await ctx.conversate({
    source: "describeImageDocument",
    controller: createController({
      model: ctx.model,
      build: (next) => {
        pointer.value = next;
      },
    }),
    enforceFunctionCall: true,
    histories: transformDescribeImagesDocumentHistories({
      integrations: props.integrations,
    }),
    userMessage: [
      {
        type: "text",
        text: `Combine all ${props.integrations.length} integrated sections into a complete B2B SaaS requirements document.`,
      },
    ],
  });

  if (pointer.value === null)
    throw new Error("Failed to complete the requirements document");

  const event: AutoBeDescribeImageDocumentEvent = {
    type: "describeImageDocument",
    id: v7(),
    document: pointer.value.document,
    summary: pointer.value.summary,
    sections: pointer.value.sections,
    metric,
    tokenUsage,
    created_at: new Date().toISOString(),
  };

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
