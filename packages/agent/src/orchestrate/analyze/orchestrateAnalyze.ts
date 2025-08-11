import {
  AutoBeAnalyzeHistory,
  AutoBeAssistantMessageHistory,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import { v4 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeApplicationProps } from "../../context/IAutoBeApplicationProps";
import { orchestrateAnalyzeScenario } from "./orchestrateAnalyzeScenario";
import { IAutoBeanalyzeScenarioInput } from "./structures/IAutoBeAnalyzeScenarioApplication";
import { writeDocumentUntilReviewPassed } from "./writeDocumentUntilReviewPassed";

/** @todo Kakasoo */
export const orchestrateAnalyze =
  <Model extends ILlmSchema.Model>(ctx: AutoBeContext<Model>) =>
  async (
    props: IAutoBeApplicationProps,
  ): Promise<AutoBeAssistantMessageHistory | AutoBeAnalyzeHistory> => {
    const step: number = ctx.state().analyze?.step ?? 0;
    const start: Date = new Date();
    ctx.dispatch({
      type: "analyzeStart",
      reason: props.reason,
      step,
      created_at: start.toISOString(),
    });

    const pointer: IPointer<IAutoBeanalyzeScenarioInput | null> = {
      value: null,
    };
    await orchestrateAnalyzeScenario(ctx, (v) => (pointer.value = v));
    pointer.value?.files.map((el) => el.filename);

    const scenarioInput = pointer.value;
    if (scenarioInput === null)
      return ctx.assistantMessage({
        id: v4(),
        text: "Failed to analyze your request. please request again.",
        type: "assistantMessage",
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });

    ctx.dispatch({
      type: "analyzeScenario",
      page: scenarioInput.page,
      prefix: scenarioInput.prefix,
      roles: scenarioInput.roles,
      filenames: scenarioInput.files.map((el) => el.filename),
      step: step,
      created_at: new Date().toISOString(),
    });

    const {
      files: autoBeAnalyzeFiles,
      prefix,
      roles,
      language,
    } = scenarioInput;
    if (autoBeAnalyzeFiles.length === 0)
      return ctx.assistantMessage({
        id: v4(),
        type: "assistantMessage",
        text: "The current requirements are insufficient, so file generation will be suspended. It would be better to continue the conversation.",
        created_at: start.toISOString(),
        completed_at: new Date().toISOString(),
      });

    const retryCount = 3 as const;
    const progress = {
      total: autoBeAnalyzeFiles.length * retryCount,
      completed: 0,
    } as const;

    const pointers = await Promise.all(
      autoBeAnalyzeFiles.map(async (file) => {
        return await writeDocumentUntilReviewPassed(ctx, {
          totalFiles: autoBeAnalyzeFiles,
          file: file,
          roles,
          progress,
          retry: retryCount,
          language,
        });
      }),
    );

    const files = pointers
      .map((pointer) => {
        return pointer.value?.files ?? {};
      })
      .reduce((acc, cur) => Object.assign(acc, cur));

    return ctx.dispatch({
      type: "analyzeComplete",
      prefix,
      files,
      step,
      roles,
      elapsed: new Date().getTime() - start.getTime(),
      created_at: new Date().toISOString(),
    });
  };
