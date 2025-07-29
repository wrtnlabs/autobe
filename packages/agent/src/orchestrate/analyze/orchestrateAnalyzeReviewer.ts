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
  const res = await agent.conversate(command).finally(() => {
    const tokenUsage = agent.getTokenUsage();
    ctx.usage().record(tokenUsage, ["analyze"]);
  });

  return fnCalled.value;
};

/**
 * If you decide that you no longer need any reviews, or if the reviewer refuses
 * to do so, call abort. This is a function to end document creation and review,
 * and to respond to users.
 *
 * When there is content you are unsure about and need to ask the user a
 * question, abort the process and ask the user directly. The reason for
 * aborting should be included as the content of the question.
 */
// abort(input: { reason: string }): "OK";

// abort(_input: { reason: string }): "OK" {
//   return "OK";
// }

interface IAutoBeAnalyzerReviewerSystem {
  /**
   * If you decide that you no longer need any reviews, or if the reviewer
   * refuses to do so, call accept. This is a function to end document creation
   * and review, and to respond to users.
   */
  accept(): "OK" | Promise<"OK">;

  /**
   * If you have any objection about the files, call reject. This is a function
   * to reject the document for to try rewriting document.
   */
  reject(input: { reason: string }): "OK" | Promise<"OK">;
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  setResult: (result: IOrchestrateAnalyzeReviewerResult) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);
  const application: ILlmApplication<Model> = collection[
    props.model
  ] as unknown as ILlmApplication<Model>;
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
