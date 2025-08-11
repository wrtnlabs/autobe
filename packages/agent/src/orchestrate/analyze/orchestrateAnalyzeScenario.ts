import {
  AgenticaAssistantMessageHistory,
  IAgenticaController,
  MicroAgentica,
  MicroAgenticaHistory,
} from "@agentica/core";
import {
  AutoBeAnalyzeScenarioEvent,
  AutoBeAssistantMessageHistory,
} from "@autobe/interface";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { IAutoBeAnalyzeScenarioApplication } from "./structures/IAutoBeAnalyzeScenarioApplication";

export const orchestrateAnalyzeScenario = async <
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
): Promise<AutoBeAnalyzeScenarioEvent | AutoBeAssistantMessageHistory> => {
  const start: Date = new Date();
  const pointer: IPointer<IAutoBeAnalyzeScenarioApplication.IProps | null> = {
    value: null,
  };
  const agentica: MicroAgentica<Model> = ctx.createAgent({
    source: "analyzeScenario",
    controller: createController<Model>({
      model: ctx.model,
      execute: new AutoBeAnalyzeScenarioApplication(),
      preExecute: (props: IAutoBeAnalyzeScenarioApplication.IProps) =>
        (pointer.value = props),
    }),
    histories: [
      ...ctx
        .histories()
        .filter(
          (h) => h.type === "userMessage" || h.type === "assistantMessage",
        ),
      {
        id: v4(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.ANALYZE_SCENARIO,
        created_at: new Date().toISOString(),
      },
      {
        id: v4(),
        type: "systemMessage",
        text: [
          "One agent per page of the document you specify will write according to the instructions below.",
          "You should also refer to the content to define the document list.",
          "```",
          AutoBeSystemPromptConstant.ANALYZE_WRITE,
          "```",
        ].join("\n"),
        created_at: new Date().toISOString(),
      },
    ],
    enforceFunctionCall: false,
  });
  const histories: MicroAgenticaHistory<Model>[] = await agentica
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
  if (histories.at(-1)?.type === "assistantMessage")
    return {
      ...(histories.at(-1)! as AgenticaAssistantMessageHistory),
      created_at: start.toISOString(),
      completed_at: new Date().toISOString(),
      id: v4(),
    } satisfies AutoBeAssistantMessageHistory;
  else if (pointer.value === null) {
    // unreachable
    throw new Error("Failed to extract files and tables.");
  }
  return {
    type: "analyzeScenario",
    prefix: pointer.value.prefix,
    roles: pointer.value.roles,
    files: pointer.value.files,
    step: (ctx.state().analyze?.step ?? -1) + 1,
    created_at: start.toISOString(),
  };
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
  compose(
    input: IAutoBeAnalyzeScenarioApplication.IProps,
  ): IAutoBeAnalyzeScenarioApplication.IProps {
    return input;
  }
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  execute: AutoBeAnalyzeScenarioApplication;
  preExecute: (input: IAutoBeAnalyzeScenarioApplication.IProps) => void;
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
  "claude"
>();
const collection = {
  chatgpt: typia.llm.application<AutoBeAnalyzeScenarioApplication, "chatgpt">(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};
