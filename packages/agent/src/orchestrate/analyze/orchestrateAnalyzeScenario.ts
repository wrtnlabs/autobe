import {
  AgenticaAssistantMessageHistory,
  IAgenticaController,
} from "@agentica/core";
import {
  AutoBeAnalyzeScenarioEvent,
  AutoBeAssistantMessageHistory,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { transformAnalyzeSceHistories } from "./histories/transformAnalyzeScenarioHistories";
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
  const { histories, tokenUsage } = await ctx.conversate({
    source: "analyzeScenario",
    controller: createController<Model>({
      model: ctx.model,
      build: (value) => (pointer.value = value),
    }),
    histories: transformAnalyzeSceHistories(ctx),
    enforceFunctionCall: false,
    message: StringUtil.trim`
      Design a complete list of documents and user roles for this project.
      Define user roles that can authenticate via API and create appropriate documentation files.
      You must respect the number of documents specified by the user.
      Note that the user's locale is in ${ctx.locale}.
    `,
  });
  if (histories.at(-1)?.type === "assistantMessage")
    return {
      ...(histories.at(-1)! as AgenticaAssistantMessageHistory),
      created_at: start.toISOString(),
      completed_at: new Date().toISOString(),
      id: v7(),
    } satisfies AutoBeAssistantMessageHistory;
  else if (pointer.value === null) {
    // unreachable
    throw new Error("Failed to extract files and tables.");
  }
  return {
    type: "analyzeScenario",
    id: v7(),
    prefix: pointer.value.prefix,
    language: pointer.value.language,
    roles: pointer.value.roles,
    files: pointer.value.files,
    tokenUsage,
    step: (ctx.state().analyze?.step ?? -1) + 1,
    created_at: start.toISOString(),
  };
};

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (value: IAutoBeAnalyzeScenarioApplication.IProps) => void;
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
        props.build(input);
      },
    } satisfies IAutoBeAnalyzeScenarioApplication,
  };
}

const claude = typia.llm.application<
  IAutoBeAnalyzeScenarioApplication,
  "claude"
>();
const collection = {
  chatgpt: typia.llm.application<
    IAutoBeAnalyzeScenarioApplication,
    "chatgpt"
  >(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};
