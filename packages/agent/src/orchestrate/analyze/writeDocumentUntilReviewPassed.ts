import { ILlmSchema } from "@samchon/openapi";

import { AutoBeContext } from "../../context/AutoBeContext";
import {
  AutoBEAnalyzeFileMap,
  AutoBeAnalyzePointer,
} from "./AutoBeAnalyzePointer";
import { orchestrateAnalyzeReviewer } from "./orchestrateAnalyzeReviewer";
import { orchestrateAnalyzeWrite } from "./orchestrateAnalyzeWrite";
import { AutoBeAnalyzeWriteProps } from "./structures/AutoBeAnalyzeWriteProps";
import { IOrchestrateAnalyzeReviewerResult } from "./structures/IAutoBeAnalyzeReviewApplication";

export async function writeDocumentUntilReviewPassed<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  props: AutoBeAnalyzeWriteProps,
): Promise<AutoBeAnalyzePointer> {
  const retry = props.retry ?? 3;
  const pointer: { value: { files: AutoBEAnalyzeFileMap } } = {
    value: { files: {} },
  };

  /**
   * `retry` means the number of times to retry the review. so if `retry` is -1,
   * it means not execute this logic.
   */
  if (retry === -1) {
    return pointer;
  }

  let isToolCalled = false;
  await orchestrateAnalyzeWrite(ctx, {
    totalFiles: props.totalFiles,
    roles: props.roles,
    file: props.file,
    review: props.prevReview ?? "",
    setDocument: (v) => {
      isToolCalled = true;
      pointer.value = { files: { ...pointer.value?.files, ...v } };
    },
    language: props.language,
  });

  if (isToolCalled === false) {
    throw new Error("Failed to write document by unknown reason.");
  }

  ctx.dispatch({
    type: "analyzeWrite",
    files: {
      ...pointer.value?.files,
    },
    total: props.progress.total,
    completed: ++props.progress.completed,
    step: ctx.state().analyze?.step ?? 0,
    created_at: new Date().toISOString(),
  });

  const reviewResult: IOrchestrateAnalyzeReviewerResult =
    await orchestrateAnalyzeReviewer(ctx, props, pointer.value);

  ctx.dispatch({
    type: "analyzeReview",
    files: {
      ...pointer.value.files,
    },
    review: reviewResult.type === "accept" ? "accept" : reviewResult.value,
    total: props.progress.total,
    completed: props.progress.completed,
    step: ctx.state().analyze?.step ?? 0,
    created_at: new Date().toISOString(),
  });

  if (reviewResult.type === "accept") {
    return pointer;
  }

  return await writeDocumentUntilReviewPassed(ctx, {
    totalFiles: props.totalFiles,
    file: props.file,
    roles: props.roles,
    progress: props.progress,
    retry: retry - 1,
    prevReview: reviewResult.value,
  });
}
