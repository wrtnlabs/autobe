import { IAgenticaController, MicroAgentica } from "@agentica/core";
import {
  AutoBeAnalyzeReviewEvent,
  AutoBeAnalyzeScenarioEvent,
} from "@autobe/interface";
import { AutoBeAnalyzeFile } from "@autobe/interface/src/histories/contents/AutoBeAnalyzeFile";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { transformAnalyzeReviewerHistories } from "./histories/transformAnalyzeReviewerHistories";
import { IAutoBeAnalyzeReviewApplication } from "./structures/IAutoBeAnalyzeReviewApplication";

export const orchestrateAnalyzeReview = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  scenario: AutoBeAnalyzeScenarioEvent,
  otherFiles: AutoBeAnalyzeFile[],
  myFile: AutoBeAnalyzeFile,
  progress: {
    total: number;
    completed: number;
  },
): Promise<AutoBeAnalyzeReviewEvent> => {
  const pointer: IPointer<IAutoBeAnalyzeReviewApplication.IProps | null> = {
    value: null,
  };
  const agent: MicroAgentica<Model> = ctx.createAgent({
    source: "analyzeReview",
    controller: createController({
      model: ctx.model,
      pointer,
    }),
    histories: [
      ...transformAnalyzeReviewerHistories(scenario, otherFiles, myFile),
    ],
    enforceFunctionCall: true,
  });
  const command = `proceed with the review of these files only.` as const;
  await agent.conversate(command).finally(() => {
    const tokenUsage = agent.getTokenUsage().aggregate;
    ctx.usage().record(tokenUsage, ["analyze"]);
  });
  if (pointer.value === null)
    throw new Error("Failed to extract review information.");

  const event: AutoBeAnalyzeReviewEvent = {
    type: "analyzeReview",
    file: myFile,
    plan: pointer.value.plan,
    review: pointer.value.review,
    content: pointer.value.content,
    total: progress.total,
    completed: progress.completed,
    step: (ctx.state().analyze?.step ?? -1) + 1,
    created_at: new Date().toISOString(),
  };
  ctx.dispatch(event);
  return event;
};

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  pointer: IPointer<IAutoBeAnalyzeReviewApplication.IProps | null>;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const application: ILlmApplication<Model> = collection[
    props.model === "chatgpt" ? "chatgpt" : "claude"
  ] satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: "Reviewer",
    application,
    execute: {
      review: (input) => {
        props.pointer.value = input;
      },
    } satisfies IAutoBeAnalyzeReviewApplication,
  };
}

const claude = typia.llm.application<
  IAutoBeAnalyzeReviewApplication,
  "claude"
>();
const collection = {
  chatgpt: typia.llm.application<IAutoBeAnalyzeReviewApplication, "chatgpt">(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};
