import {
  AutoBeAnalyzeHistory,
  AutoBeAssistantMessageHistory,
} from "@autobe/interface";
import { AutoBeAnalyzeFile } from "@autobe/interface/src/histories/contents/AutoBeAnalyzeFile";
import { ILlmSchema } from "@samchon/openapi";
import { v4 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeApplicationProps } from "../../context/IAutoBeApplicationProps";
import { orchestrateAnalyzeReview } from "./orchestrateAnalyzeReview";
import { orchestrateAnalyzeScenario } from "./orchestrateAnalyzeScenario";
import { orchestrateAnalyzeWrite } from "./orchestrateAnalyzeWrite";
import { IOrchestrateAnalyzeReviewerResult } from "./structures/IAutoBeAnalyzeReviewApplication";
import { IAutoBeAnalyzeScenarioApplication } from "./structures/IAutoBeAnalyzeScenarioApplication";

const MAX_REVIEW_ITERATIONS = 3;

export const orchestrateAnalyze =
  <Model extends ILlmSchema.Model>(ctx: AutoBeContext<Model>) =>
  async (
    props: IAutoBeApplicationProps,
  ): Promise<AutoBeAssistantMessageHistory | AutoBeAnalyzeHistory> => {
    // Initialize analysis state
    const step = ctx.state().analyze?.step ?? 0;
    const startTime = new Date();

    ctx.dispatch({
      type: "analyzeStart",
      reason: props.reason,
      step,
      created_at: startTime.toISOString(),
    });

    // Generate analysis scenario
    const scenario: IAutoBeAnalyzeScenarioApplication.IProps | null =
      await orchestrateAnalyzeScenario(ctx);

    if (scenario === null) {
      return ctx.assistantMessage({
        id: v4(),
        text: "Failed to analyze your request. please request again.",
        type: "assistantMessage",
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });
    }

    // Check if requirements are sufficient
    if (scenario.files.length === 0) {
      return ctx.assistantMessage({
        id: v4(),
        type: "assistantMessage",
        text: "The current requirements are insufficient, so file generation will be suspended. It would be better to continue the conversation.",
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      });
    }

    // Process all files in parallel
    const progress = {
      total: scenario.files.length * MAX_REVIEW_ITERATIONS,
      completed: 0,
    };

    const files: AutoBeAnalyzeFile[] = [];

    await Promise.all(
      scenario.files.map(async (file) => {
        let content: string | null = null;
        let reviewFeedback: string | null = null;

        // Iterate through write-review cycle
        for (
          let iteration = 0;
          iteration < MAX_REVIEW_ITERATIONS;
          iteration++
        ) {
          // Write markdown document
          content = await orchestrateAnalyzeWrite(ctx, {
            totalFiles: scenario.files,
            language: scenario.language,
            roles: scenario.roles,
            file,
            review: reviewFeedback,
          });

          // Review the written document
          const reviewResult: IOrchestrateAnalyzeReviewerResult =
            await orchestrateAnalyzeReview(
              ctx,
              {
                totalFiles: scenario.files,
                file,
                progress,
                roles: scenario.roles,
                language: scenario.language,
              },
              {
                files: { [file.filename]: content },
              },
            );

          // Exit loop if document is accepted
          if (reviewResult.type === "accept") {
            break;
          }

          // Store feedback for next iteration
          reviewFeedback =
            reviewResult.type === "reject" ? reviewResult.value : null;
        }

        // Store the final markdown content
        if (content !== null) {
          files.push({ ...file, content });
        }
      }),
    );

    // Complete the analysis
    return ctx.dispatch({
      type: "analyzeComplete",
      prefix: scenario.prefix,
      files,
      step,
      roles: scenario.roles,
      elapsed: new Date().getTime() - startTime.getTime(),
      created_at: new Date().toISOString(),
    }) satisfies AutoBeAnalyzeHistory;
  };
