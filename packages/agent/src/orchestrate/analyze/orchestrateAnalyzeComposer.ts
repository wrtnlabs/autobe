import { IAgenticaController, MicroAgentica } from "@agentica/core";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import typia from "typia";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { enforceToolCall } from "../../utils/enforceToolCall";
import {
  IAutoBeAnalyzeComposerApplication,
  IComposeInput,
} from "./structures/IAutoBeAnalyzeComposerApplication";

export const orchestrateAnalyzeComposer = <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  setComposeInput: (value: IComposeInput) => void,
) => {
  const controller = createController<Model>({
    model: ctx.model,
    execute: new AutoBeAnalyzeComposerApplication(),
    preExecute: setComposeInput,
  });

  const agent = new MicroAgentica({
    model: ctx.model,
    vendor: ctx.vendor,
    controllers: [controller],
    config: {
      locale: ctx.config?.locale,
      executor: {
        describe: null,
      },
    },
    histories: [
      ...ctx
        .histories()
        .filter(
          (h) => h.type === "userMessage" || h.type === "assistantMessage",
        ),
      {
        id: v4(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.ANALYZE_COMPOSER,
        created_at: new Date().toISOString(),
      },
    ],
  });
  enforceToolCall(agent);
  return agent;
};

class AutoBeAnalyzeComposerApplication
  implements IAutoBeAnalyzeComposerApplication
{
  /**
   * Compose project structure with roles and files.
   *
   * Design a list of roles and initial documents that you need to create for
   * that requirement. Roles define team member responsibilities, while files
   * define the documentation structure. These are managed separately. If you
   * determine from the conversation that the user's requirements have not been
   * fully gathered, you must stop the analysis and continue collecting the
   * remaining requirements. In this case, you do not need to generate any files
   * or roles. Simply pass an empty array to `input.files` and `input.roles`.
   *
   * @param input Prefix, roles, and files
   * @returns
   */
  compose(input: IComposeInput): IComposeInput {
    return input;
  }
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  execute: AutoBeAnalyzeComposerApplication;
  preExecute: (input: IComposeInput) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);
  const application: ILlmApplication<Model> = collection[
    props.model
  ] satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: "Compose",
    application,
    execute: {
      compose: (input) => {
        props.preExecute(input);
        return props.execute.compose(input);
      },
    } satisfies IAutoBeAnalyzeComposerApplication,
  };
}

const claude = typia.llm.application<
  AutoBeAnalyzeComposerApplication,
  "claude",
  { reference: true }
>();
const collection = {
  chatgpt: typia.llm.application<
    AutoBeAnalyzeComposerApplication,
    "chatgpt",
    { reference: true }
  >(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};
