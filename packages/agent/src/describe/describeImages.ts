import {
  AutoBeDescribeCompleteEvent,
  AutoBeDescribeImageDocumentEvent,
  AutoBeDescribeImageDraftEvent,
  AutoBeDescribeImageDraftGroup,
  AutoBeDescribeImageDraftIntegrationEvent,
  AutoBeUserConversateContent,
  AutoBeUserImageConversateContent,
  AutoBeUserMessageHistory,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import { v7 } from "uuid";

import { AutoBeContext } from "../context/AutoBeContext";
import { createAutoBeUserMessageContent } from "../factory/createAutoBeMessageContent";
import { orchestrateDescribeImagesDocument } from "./image/orchestrateDescribeImagesDocument";
import { orchestrateDescribeImagesDrafts } from "./image/orchestrateDescribeImagesDraft";
import { orchestrateDescribeImagesDraftsGroups } from "./image/orchestrateDescribeImagesDraftsGroups";
import { orchestrateDescribeImagesDraftsIntegrations } from "./image/orchestrateDescribeImagesDraftsIntegrations";

export const describeImages = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    content: AutoBeUserConversateContent[];
  },
): Promise<AutoBeUserMessageHistory> => {
  const start: Date = new Date();
  const step: number = ctx.state().analyze?.step ?? 0;

  const imageContents: AutoBeUserImageConversateContent[] =
    props.content.filter((m) => m.type === "image");
  const imageCount: number = imageContents.length;
  if (imageCount === 0) throw new Error("No image content found");
  ctx.dispatch({
    type: "describeStart",
    id: v7(),
    imageCount,
    step,
    created_at: new Date().toISOString(),
  });

  const drafts: AutoBeDescribeImageDraftEvent[] =
    await orchestrateDescribeImagesDrafts(ctx, { content: props.content });

  const groups: AutoBeDescribeImageDraftGroup[] =
    await orchestrateDescribeImagesDraftsGroups(ctx, { drafts });

  const integrations: AutoBeDescribeImageDraftIntegrationEvent[] =
    await orchestrateDescribeImagesDraftsIntegrations(ctx, {
      groups,
    });

  const document: AutoBeDescribeImageDocumentEvent =
    await orchestrateDescribeImagesDocument(ctx, { integrations });

  // Emit completion event
  const complete: AutoBeDescribeCompleteEvent = {
    type: "describeComplete",
    id: v7(),
    document: document.document,
    summary: document.summary,
    sections: document.sections,
    aggregates: ctx.getCurrentAggregates("describe"),
    step,
    elapsed: new Date().getTime() - start.getTime(),
    created_at: new Date().toISOString(),
  };
  ctx.dispatch(complete);
  return {
    ...complete,
    type: "userMessage",
    contents: imageContents.map((c) =>
      createAutoBeUserMessageContent({
        content: c,
        description: document.document,
      }),
    ),
  } satisfies AutoBeUserMessageHistory;
};
