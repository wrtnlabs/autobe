import { IAgenticaController, MicroAgentica } from "@agentica/core";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import typia from "typia";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { enforceToolCall } from "../../utils/enforceToolCall";
import {
  IAutoBeAnalyzeScenarioApplication,
  IAutoBeanalyzeScenarioInput,
} from "./structures/IAutoBeAnalyzeScenarioApplication";

export const orchestrateAnalyzeScenario = async <
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  setComposeInput: (value: IAutoBeanalyzeScenarioInput) => void,
): Promise<void> => {
  const controller = createController<Model>({
    model: ctx.model,
    execute: new AutoBeAnalyzeScenarioApplication(),
    preExecute: setComposeInput,
  });

  const agentica = new MicroAgentica({
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
  enforceToolCall(agentica);

  await agentica
    .conversate(
      [
        `Design a complete list of documents and user roles for this project.`,
        `Define user roles that can authenticate via API and create appropriate documentation files.`,
        `You must respect the number of documents specified by the user.`,
      ].join("\n"),
    )
    .finally(() => {
      const tokenUsage = agentica.getTokenUsage().aggregate;
      ctx.usage().record(tokenUsage, ["analyze"]);
    });
};

class AutoBeAnalyzeScenarioApplication
  implements IAutoBeAnalyzeScenarioApplication
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
  compose(input: IAutoBeanalyzeScenarioInput): IAutoBeanalyzeScenarioInput {
    return input;
  }
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  execute: AutoBeAnalyzeScenarioApplication;
  preExecute: (input: IAutoBeanalyzeScenarioInput) => void;
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
    } satisfies IAutoBeAnalyzeScenarioApplication,
  };
}

const claude = typia.llm.application<
  AutoBeAnalyzeScenarioApplication,
  "claude",
  { reference: true }
>();
const collection = {
  chatgpt: typia.llm.application<
    AutoBeAnalyzeScenarioApplication,
    "chatgpt",
    { reference: true }
  >(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};
