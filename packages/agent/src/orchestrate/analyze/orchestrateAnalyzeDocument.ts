import { IAgenticaController } from "@agentica/core";
import {
  AutoBeAnalyzeDocumentEvent,
  AutoBeAnalyzeDocumentSection,
  AutoBeEventSource,
} from "@autobe/interface";
import { ILlmApplication, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { transformAnalyzeDocumentHistory } from "./histories/transformAnalyzeDocumentHistory";
import { IAutoBeAnalyzeDocumentApplication } from "./structures/IAutoBeAnalyzeDocumentApplication";

/**
 * Orchestrate Semantic Layer extraction for a single analysis file.
 *
 * Given the file's assembled markdown content and its Evidence Layer sections,
 * this orchestrator makes an LLM call to extract structured SRS categories with
 * `sourceSectionIds` traceability.
 */
export const orchestrateAnalyzeDocument = async (
  ctx: AutoBeContext,
  props: {
    fileIndex: number;
    filename: string;
    categoryId: string;
    content: string;
    sections: AutoBeAnalyzeDocumentSection[];
    retry?: number;
  },
): Promise<AutoBeAnalyzeDocumentEvent> => {
  const start: Date = new Date();
  const pointer: IPointer<IAutoBeAnalyzeDocumentApplication.IComplete | null> =
    { value: null };

  const result: AutoBeContext.IResult = await ctx.conversate({
    source: SOURCE,
    controller: createController({ pointer }),
    enforceFunctionCall: true,
    retry: props.retry,
    ...transformAnalyzeDocumentHistory({
      fileIndex: props.fileIndex,
      filename: props.filename,
      categoryId: props.categoryId,
      content: props.content,
      sections: props.sections,
    }),
  });

  if (pointer.value === null) {
    // Fallback: empty SRS with no categories
    const fallback: AutoBeAnalyzeDocumentEvent = {
      type: SOURCE,
      id: v7(),
      fileIndex: props.fileIndex,
      filename: props.filename,
      srs: { selectedCategories: [] },
      tokenUsage: result.tokenUsage,
      metric: result.metric,
      step: (ctx.state().analyze?.step ?? -1) + 1,
      created_at: start.toISOString(),
    };
    ctx.dispatch(fallback);
    return fallback;
  }

  const event: AutoBeAnalyzeDocumentEvent = {
    type: SOURCE,
    id: v7(),
    fileIndex: props.fileIndex,
    filename: props.filename,
    srs: pointer.value.srs,
    tokenUsage: result.tokenUsage,
    metric: result.metric,
    step: (ctx.state().analyze?.step ?? -1) + 1,
    created_at: start.toISOString(),
  };
  ctx.dispatch(event);
  return event;
};

function createController(props: {
  pointer: IPointer<IAutoBeAnalyzeDocumentApplication.IComplete | null>;
}): IAgenticaController.IClass {
  const application: ILlmApplication =
    typia.llm.application<IAutoBeAnalyzeDocumentApplication>({
      validate: {
        process: (
          input: unknown,
        ): IValidation<IAutoBeAnalyzeDocumentApplication.IProps> =>
          typia.validate<IAutoBeAnalyzeDocumentApplication.IProps>(input),
      },
    });
  return {
    protocol: "class",
    name: SOURCE,
    application,
    execute: {
      process: (input) => {
        if (input.request.type === "complete")
          props.pointer.value = input.request;
      },
    } satisfies IAutoBeAnalyzeDocumentApplication,
  };
}

const SOURCE = "analyzeDocument" satisfies AutoBeEventSource;
