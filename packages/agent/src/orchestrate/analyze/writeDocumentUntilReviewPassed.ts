import { AutoBeAnalyzeRole } from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

import { AutoBeContext } from "../../context/AutoBeContext";
import { IFile } from "./AutoBeAnalyzeFileSystem";
import {
  AutoBEAnalyzeFileMap,
  AutoBeAnalyzePointer,
} from "./AutoBeAnalyzePointer";
import { orchestrateAnalyzeReviewer } from "./orchestrateAnalyzeReviewer";
import { orchestrateAnalyzeWrite } from "./orchestrateAnalyzeWrite";

export async function writeDocumentUntilReviewPassed<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  props: {
    totalFiles: Pick<IFile, "filename" | "reason">[];
    filename: string;
    roles: AutoBeAnalyzeRole[];
    progress: { total: number; completed: number };
    retry?: number;
    prevReview?: string;
  },
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

  const writer = orchestrateAnalyzeWrite(ctx, {
    totalFiles: props.totalFiles,
    roles: props.roles,
    targetFile: props.filename,
    review: props.prevReview ?? "",
    setDocument: (v) => {
      pointer.value = { files: { ...pointer.value?.files, ...v } };
    },
  });
  await writer.conversate("Write Document.").finally(() => {
    const tokenUsage = writer.getTokenUsage();
    ctx.usage().record(tokenUsage, ["analyze"]);
  });

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

  const reviewResult = await orchestrateAnalyzeReviewer(ctx, pointer.value);

  if (reviewResult.type === "accept") {
    return pointer;
  }

  ctx.dispatch({
    type: "analyzeReview",
    files: {
      ...pointer.value.files,
    },
    review: reviewResult.value,
    total: props.progress.total,
    completed: props.progress.completed,
    step: ctx.state().analyze?.step ?? 0,
    created_at: new Date().toISOString(),
  });

  return await writeDocumentUntilReviewPassed(ctx, {
    totalFiles: props.totalFiles,
    filename: props.filename,
    roles: props.roles,
    progress: props.progress,
    retry: retry - 1,
    prevReview: reviewResult.value,
  });
}
