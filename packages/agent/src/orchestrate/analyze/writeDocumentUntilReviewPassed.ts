import { ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";

import { AutoBeContext } from "../../context/AutoBeContext";
import { IFile } from "./AutoBeAnalyzeFileSystem";
import { AutoBeAnalyzePointer } from "./AutoBeAnalyzePointer";
import { AutoBeAnalyzeRole } from "./AutoBeAnalyzeRole";
import { orchestrateAnalyzeReviewer } from "./orchestrateAnalyzeReviewer";
import { orchestrateAnalyzeWrite } from "./orchestrateAnalyzeWrite";

export async function writeDocumentUntilReviewPassed<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  pointer: AutoBeAnalyzePointer,
  totalFiles: Pick<IFile, "filename" | "reason">[],
  filename: string,
  roles: AutoBeAnalyzeRole[],
  retry = 3,
): Promise<AutoBeAnalyzePointer> {
  let isAborted: IPointer<boolean> = { value: false };

  let review: string | null = null;
  for (let i = 0; i < retry; i++) {
    if (isAborted.value === true) {
      return pointer;
    }

    const write = "Write Document OR Abort." as const;
    const writer = orchestrateAnalyzeWrite(
      ctx,
      {
        totalFiles: totalFiles,
        roles: roles,
        targetFile: filename,
        review,
      },
      pointer,
      isAborted,
    );

    await writer.conversate(review ?? write).finally(() => {
      const tokenUsage = writer.getTokenUsage();
      ctx.usage().record(tokenUsage, ["analyze"]);
    });

    if (pointer.value === null) {
      throw new Error("Failed to write document by unknown reason.");
    }

    review = await orchestrateAnalyzeReviewer(ctx, pointer.value);
  }

  return pointer;
}
