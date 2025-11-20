import {
  AutoBeImageDescribeCompleteEvent,
  AutoBeImageDescribeDraftEvent,
  AutoBeUserConversateContent,
  AutoBeUserImageConversateContent,
  AutoBeUserMessageHistory,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import { v7 } from "uuid";

import { AutoBeContext } from "../context/AutoBeContext";
import { createAutoBeUserMessageContent } from "../factory/createAutoBeMessageContent";
import { orchestrateImageDescribeDrafts } from "./image/orchestrateImageDescribeDraft";

export const imageDescribe = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    content: AutoBeUserConversateContent[];
  },
): Promise<AutoBeUserMessageHistory> => {
  const start: Date = new Date();

  const imageContents: AutoBeUserImageConversateContent[] =
    props.content.filter((m) => m.type === "image");
  const imageCount: number = imageContents.length;
  if (imageCount === 0) throw new Error("No image content found");
  ctx.dispatch({
    type: "imageDescribeStart",
    id: v7(),
    imageCount,
    created_at: new Date().toISOString(),
  });

  const drafts: AutoBeImageDescribeDraftEvent[] =
    await orchestrateImageDescribeDrafts(ctx, { content: props.content });

  // Create descriptions from drafts
  const descriptions = drafts.map((draft) => ({
    observation: draft.observation,
    analysis: draft.analysis,
    topics: draft.topics,
    summary: draft.summary,
    description: draft.draft,
  }));

  // Emit completion event
  const complete: AutoBeImageDescribeCompleteEvent = {
    type: "imageDescribeComplete",
    id: v7(),
    contents: imageContents.map((c, index) =>
      createAutoBeUserMessageContent({
        content: c,
        description: descriptions[index] ? JSON.stringify(descriptions[index], null, 2) : undefined,
      }),
    ),
    elapsed: new Date().getTime() - start.getTime(),
    created_at: new Date().toISOString(),
  };
  ctx.dispatch(complete);
  return {
    ...complete,
    type: "userMessage",
  } satisfies AutoBeUserMessageHistory;
};
