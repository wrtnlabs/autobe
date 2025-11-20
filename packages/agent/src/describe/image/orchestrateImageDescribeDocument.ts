import {
  IAgenticaController,
  IAgenticaTokenUsageJson,
  MicroAgentica,
} from "@agentica/core";
import {
  AutoBeImageDescribeDocumentEvent,
  AutoBeImageDescribeDraftIntegrationEvent,
} from "@autobe/interface";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { supportMistral } from "../../factory/supportMistral";
import { transformImageDescribeDocumentHistories } from "./histories/transformImageDescribeDocumentHistories";
import { IAutoBeImageDescribeDocumentApplication } from "./structures/IAutoBeImageDescribeDocumentApplication";

export const orchestrateImageDescribeDocument = async <
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  props: {
    integrations: AutoBeImageDescribeDraftIntegrationEvent[];
  },
): Promise<AutoBeImageDescribeDocumentEvent> => {
  const pointer: IPointer<IAutoBeImageDescribeDocumentApplication.IProps | null> =
    {
      value: null,
    };

  const { histories, userMessage } = transformImageDescribeDocumentHistories({
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
  ctx.usage().record(tokenUsage, ["describe"]);
  if (pointer.value === null)
    throw new Error("Failed to complete the requirements document");

  const event: AutoBeImageDescribeDocumentEvent = {
    type: "imageDescribeDocument",
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
  build: (next: IAutoBeImageDescribeDocumentApplication.IProps) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const validate: Validator = (next: unknown) => {
    const result: IValidation<IAutoBeImageDescribeDocumentApplication.IProps> =
      typia.validate<IAutoBeImageDescribeDocumentApplication.IProps>(next);
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
    } satisfies IAutoBeImageDescribeDocumentApplication,
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBeImageDescribeDocumentApplication, "chatgpt">({
      validate: {
        completeDocument: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBeImageDescribeDocumentApplication, "claude">({
      validate: {
        completeDocument: validate,
      },
    }),
  gemini: (validate: Validator) =>
    typia.llm.application<IAutoBeImageDescribeDocumentApplication, "gemini">({
      validate: {
        completeDocument: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeImageDescribeDocumentApplication.IProps>;
