import {
  AutoBeImageDescribeCompleteEvent,
  AutoBeImageDescribeDraft,
  AutoBeUserConversateContent,
  AutoBeUserImageConversateContent,
  AutoBeUserMessageContent,
  AutoBeUserMessageHistory,
} from "@autobe/interface";
import { v7 } from "uuid";

import { AutoBeContext } from "../context/AutoBeContext";
import { createAutoBeUserMessageContent } from "../factory/createAutoBeMessageContent";
import { orchestrateImageDescribeDrafts } from "./image/orchestrateImageDescribeDraft";

export const imageDescribe = async (
  ctx: AutoBeContext,
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

  const drafts: AutoBeImageDescribeDraft[] =
    await orchestrateImageDescribeDrafts(ctx, { content: props.content });
  const draftContents: AutoBeUserMessageContent[] = drafts.map((d) =>
    createAutoBeUserMessageContent({
      content: d.image,
      description: d.description,
    }),
  );
  const query: AutoBeUserMessageContent = {
    type: "text",
    text: "Based on the image analysis above, please analyze and write a comprehensive requirements specification document.",
  };
  const complete: AutoBeImageDescribeCompleteEvent = {
    type: "imageDescribeComplete",
    id: v7(),
    contents: [...draftContents, query],
    elapsed: new Date().getTime() - start.getTime(),
    created_at: new Date().toISOString(),
  };
  ctx.dispatch(complete);
  return {
    ...complete,
    type: "userMessage",
  } satisfies AutoBeUserMessageHistory;
};
