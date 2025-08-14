import {
  AutoBeAnalyzeHistory,
  AutoBeAnalyzeReviewEvent,
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeWriteEvent,
  AutoBeAssistantMessageHistory,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { AutoBeAnalyzeFile } from "@autobe/interface/src/histories/contents/AutoBeAnalyzeFile";
import { ILlmSchema } from "@samchon/openapi";

import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeApplicationProps } from "../../context/IAutoBeApplicationProps";
import { orchestrateAnalyzeReview } from "./orchestrateAnalyzeReview";
import { orchestrateAnalyzeScenario } from "./orchestrateAnalyzeScenario";
import { orchestrateAnalyzeWrite } from "./orchestrateAnalyzeWrite";

export const orchestrateAnalyze =
  <Model extends ILlmSchema.Model>(ctx: AutoBeContext<Model>) =>
  async (
    props: IAutoBeApplicationProps,
  ): Promise<AutoBeAssistantMessageHistory | AutoBeAnalyzeHistory> => {
    // Initialize analysis state
    const step: number = (ctx.state().analyze?.step ?? -1) + 1;
    const startTime: Date = new Date();

    ctx.dispatch({
      type: "analyzeStart",
      reason: props.reason,
      step,
      created_at: startTime.toISOString(),
    });

    // Generate analysis scenario
    const scenario: AutoBeAnalyzeScenarioEvent | AutoBeAssistantMessageHistory =
      await orchestrateAnalyzeScenario(ctx);
    if (scenario.type === "assistantMessage")
      return ctx.assistantMessage(scenario);
    else ctx.dispatch(scenario);

    // write documents
    const writeProgress: AutoBeProgressEventBase = {
      total: scenario.files.length,
      completed: 0,
    };
    const fileList: AutoBeAnalyzeFile[] = await Promise.all(
      scenario.files.map(async (file) => {
        const event: AutoBeAnalyzeWriteEvent = await orchestrateAnalyzeWrite(
          ctx,
          scenario,
          file,
          writeProgress,
        );
        return event.file;
      }),
    );

    // review documents
    const reviewProgress: AutoBeProgressEventBase = {
      total: fileList.length,
      completed: 0,
    };
    const newFiles: AutoBeAnalyzeFile[] = await Promise.all(
      fileList.map(async (file, i) => {
        try {
          const event: AutoBeAnalyzeReviewEvent =
            await orchestrateAnalyzeReview(
              ctx,
              scenario,
              fileList.filter((_, j) => j !== i), // other files
              file,
              reviewProgress,
            );
          return {
            ...event.file,
            content: event.content,
          };
        } catch {
          return file;
        }
      }),
    );

    // Complete the analysis
    return ctx.dispatch({
      type: "analyzeComplete",
      roles: scenario.roles,
      prefix: scenario.prefix,
      files: newFiles,
      step,
      elapsed: new Date().getTime() - startTime.getTime(),
      created_at: new Date().toISOString(),
    }) satisfies AutoBeAnalyzeHistory;
  };
