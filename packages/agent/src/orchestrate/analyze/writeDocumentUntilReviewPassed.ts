import { ILlmSchema } from "@samchon/openapi";

import { AutoBeContext } from "../../context/AutoBeContext";
import {
  AutoBEAnalyzeFileMap,
  AutoBeAnalyzePointer,
} from "./AutoBeAnalyzePointer";
import { orchestrateAnalyzeReview } from "./orchestrateAnalyzeReview";
import { orchestrateAnalyzeWrite } from "./orchestrateAnalyzeWrite";
import { AutoBeAnalyzeWriteProps } from "./structures/AutoBeAnalyzeWriteProps";
import { IOrchestrateAnalyzeReviewerResult } from "./structures/IAutoBeAnalyzeReviewApplication";

export async function writeDocumentUntilReviewPassed<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  props: AutoBeAnalyzeWriteProps,
): Promise<AutoBeAnalyzePointer> {
  const pointer: { value: { files: AutoBEAnalyzeFileMap } } = {
    value: { files: {} },
  };

  let isToolCalled = false;
  await orchestrateAnalyzeWrite(ctx, {
    totalFiles: props.totalFiles,
    roles: props.roles,
    file: props.file,
    review: props.prevReview ?? "",
    language: props.language,
  });

  if (isToolCalled === false) {
    throw new Error("Failed to write document by unknown reason.");
  }

  ctx.dispatch({
    type: "analyzeWrite",
    filename: props.file.filename,
    content: pointer.value.files[props.file.filename],
    total: props.progress.total,
    completed: ++props.progress.completed,
    step: ctx.state().analyze?.step ?? 0,
    created_at: new Date().toISOString(),
  });

  const reviewResult: IOrchestrateAnalyzeReviewerResult =
    await orchestrateAnalyzeReview(ctx, props, pointer.value);

  if (reviewResult.type === "accept") {
    return pointer;
  }

  return await writeDocumentUntilReviewPassed(ctx, {
    totalFiles: props.totalFiles,
    file: props.file,
    roles: props.roles,
    progress: props.progress,
    prevReview: reviewResult.value,
  });
}
