import { MicroAgentica } from "@agentica/core";
import { ILlmSchema } from "@samchon/openapi";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../context/AutoBeContext";

export const AutoBeAnalyzeReviewer = <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  input: AutoBeAnalyzeReviewer.ICreateReviewerAgentInput,
) => {
  const agent = new MicroAgentica({
    model: ctx.model,
    vendor: ctx.vendor,
    controllers: [],
    config: {
      executor: {
        describe: null,
      },
      locale: ctx.config?.locale,
    },
    histories: [
      ...ctx
        .histories()
        .filter(
          (el) => el.type === "assistantMessage" || el.type === "userMessage",
        ),
      {
        id: v4(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.ANALYZE_REVIEWER,
      },
      {
        id: v4(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: [
          "Below are all of the files.",
          "```json",
          input.files,
          "```",
        ].join("\n"),
      },
    ],
  });

  return agent;
};

export namespace AutoBeAnalyzeReviewer {
  export interface ICreateReviewerAgentInput {
    /**
     * Indicates the initial utterance of the user. Identify the purpose of your
     * documentation for better review.
     */
    query: string;

    /** Total file names */
    files: string;
  }
}
