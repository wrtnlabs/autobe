import {
  AutoBeImageDescribeCompleteEvent,
  AutoBeImageDescribeDocumentEvent,
  AutoBeImageDescribeDraftEvent,
  AutoBeImageDescribeDraftGroup,
  AutoBeImageDescribeDraftIntegrationEvent,
  AutoBeUserConversateContent,
  AutoBeUserImageConversateContent,
  AutoBeUserMessageHistory,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import { v7 } from "uuid";

import { AutoBeContext } from "../context/AutoBeContext";
import { createAutoBeUserMessageContent } from "../factory/createAutoBeMessageContent";
import { orchestrateImageDescribeDocument } from "./image/orchestrateImageDescribeDocument";
import { orchestrateImageDescribeDrafts } from "./image/orchestrateImageDescribeDraft";
import { orchestrateImageDescribeDraftsGroups } from "./image/orchestrateImageDescribeDraftsGroups";
import { orchestrateImageDescribeDraftsIntegrations } from "./image/orchestrateImageDescribeDraftsIntegrations";

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

  const groups: AutoBeImageDescribeDraftGroup[] =
    await orchestrateImageDescribeDraftsGroups(ctx, { drafts });

  const integrations: AutoBeImageDescribeDraftIntegrationEvent[] =
    await orchestrateImageDescribeDraftsIntegrations(ctx, {
      groups,
    });

  const document: AutoBeImageDescribeDocumentEvent =
    await orchestrateImageDescribeDocument(ctx, { integrations });

  // Emit completion event
  const complete: AutoBeImageDescribeCompleteEvent = {
    type: "imageDescribeComplete",
    id: v7(),
    contents: imageContents.map((c) =>
      createAutoBeUserMessageContent({
        content: c,
        description: document.document,
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
