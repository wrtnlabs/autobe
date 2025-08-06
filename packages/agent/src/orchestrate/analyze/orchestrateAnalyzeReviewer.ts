import { IAgenticaController, MicroAgentica } from "@agentica/core";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { enforceToolCall } from "../../utils/enforceToolCall";
import { transformAnalyzeReviewerHistories } from "./transformAnalyzeReviewerHistories";

export type IOrchestrateAnalyzeReviewerResult =
  | {
      type: "reject";
      value: string;
    }
  | {
      type: "accept";
    };

export const orchestrateAnalyzeReviewer = async <
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
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

  const controller = createController({
    model: ctx.model,
    setResult: (result: IOrchestrateAnalyzeReviewerResult) => {
      fnCalled.value = result;
    },
  });
  const agent = new MicroAgentica({
    model: ctx.model,
    vendor: ctx.vendor,
    controllers: [controller],
    config: {
      ...ctx.config,
      executor: {
        describe: null,
      },
    },
    histories: [...transformAnalyzeReviewerHistories(input)],
  });
  enforceToolCall(agent);

  const command = `proceed with the review of these files only.` as const;
  await agent.conversate(command).finally(() => {
    const tokenUsage = agent.getTokenUsage().aggregate;
    ctx.usage().record(tokenUsage, ["analyze"]);
  });

  return fnCalled.value;
};

interface IAutoBeAnalyzerReviewerSystem {
  /**
   * If there is anything that needs to be modified, you can call it, This
   * function is to reject the document for to try rewriting document with your
   * advice or suggestion.
   */
  reject(input: {
    /**
     * The reason why you reject the document and the suggestion for the
     * modification. You can write the reason in detail.
     */
    reason: string;
  }): "OK" | Promise<"OK">;

  /**
   * If you decide that you no longer need any reviews, call accept. This is a
   * function to end document creation and review, and to respond to users.
   */
  accept(): "OK" | Promise<"OK">;
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  setResult: (result: IOrchestrateAnalyzeReviewerResult) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);
  const application: ILlmApplication<Model> = collection[
    props.model
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
        });
        return "OK" as const;
      },
    } satisfies IAutoBeAnalyzerReviewerSystem,
  };
}

const claude = typia.llm.application<
  IAutoBeAnalyzerReviewerSystem,
  "claude",
  { reference: true }
>();
const collection = {
  chatgpt: typia.llm.application<
    IAutoBeAnalyzerReviewerSystem,
    "chatgpt",
    { reference: true }
  >(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};
