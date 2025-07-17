import { MicroAgentica } from "@agentica/core";
import { ILlmSchema } from "@samchon/openapi";

import { AutoBeContext } from "../../context/AutoBeContext";
import { randomBackoffStrategy } from "../../utils/backoffRetry";
import { enforceToolCall } from "../../utils/enforceToolCall";
import { transformAnalyzeReviewerHistories } from "./transformAnalyzeReviewerHistories";

export const orchestrateAnalyzeReviewer = async <
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  input: {
    /** Total file names */
    files: Record<string, string>;
  },
): Promise<string | null> => {
  const agent = new MicroAgentica({
    model: ctx.model,
    vendor: ctx.vendor,
    controllers: [],
    config: {
      locale: ctx.config?.locale,
      backoffStrategy: randomBackoffStrategy,
      executor: {
        describe: null,
      },
    },
    histories: [...transformAnalyzeReviewerHistories(input)],
  });
  enforceToolCall(agent);

  const command = `proceed with the review of these files only.` as const;
  const histories = await agent.conversate(command).finally(() => {
    const tokenUsage = agent.getTokenUsage();
    ctx.usage().record(tokenUsage, ["analyze"]);
  });
  return histories.find((h) => h.type === "assistantMessage")?.text ?? null;
};
