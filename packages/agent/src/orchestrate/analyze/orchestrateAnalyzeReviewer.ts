import { IAgenticaController, MicroAgentica } from "@agentica/core";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { AutoBeAnalyzeWriteProps } from "./structures/AutoBeAnalyzeWriteProps";
import {
  IAutoBeAnalyzeReviewApplication,
  IOrchestrateAnalyzeReviewerResult,
} from "./structures/IAutoBeAnalyzeReviewApplication";
import { transformAnalyzeReviewerHistories } from "./transformAnalyzeReviewerHistories";

export const orchestrateAnalyzeReviewer = async <
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  props: AutoBeAnalyzeWriteProps,
  input: {
    /** Total file names */
    files: Record<string, string>;
  },
): Promise<IOrchestrateAnalyzeReviewerResult> => {
  const fnCalled: IPointer<IOrchestrateAnalyzeReviewerResult> = {
    value: {
      type: "reject",
      value: "reviewer is not working because of unknown reason.",
    },
  };
  const agent: MicroAgentica<Model> = ctx.createAgent({
    source: "analyzeReview",
    controller: createController({
      model: ctx.model,
      setResult: (result: IOrchestrateAnalyzeReviewerResult) => {
        fnCalled.value = result;
      },
    }),
    histories: [...transformAnalyzeReviewerHistories(props, input)],
    enforceFunctionCall: true,
  });
  const command = `proceed with the review of these files only.` as const;
  await agent.conversate(command).finally(() => {
    const tokenUsage = agent.getTokenUsage().aggregate;
    ctx.usage().record(tokenUsage, ["analyze"]);
  });

  return fnCalled.value;
};

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  setResult: (result: IOrchestrateAnalyzeReviewerResult) => void;
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
      accept: async () => {
        props.setResult({
          type: "accept",
        });
        return "OK" as const;
      },
      reject: async (input) => {
        props.setResult({
          type: "reject",
          value: input.reason,
          checklist: input.checklist,
        });
        return "OK" as const;
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
