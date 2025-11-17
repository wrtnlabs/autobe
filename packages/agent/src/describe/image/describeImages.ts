import {
  AutoBeDescribeCompleteEvent,
  AutoBeDescribeHistory,
  AutoBeDescribeImageDocumentEvent,
  AutoBeDescribeImageDraftEvent,
  AutoBeDescribeImageDraftGroup,
  AutoBeDescribeImageDraftIntegrationEvent,
  AutoBeUserMessageContent,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import fs from "fs";
import path from "path";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { orchestrateDescribeImagesDocument } from "./orchestrateDescribeImagesDocument";
import { orchestrateDescribeImagesDrafts } from "./orchestrateDescribeImagesDraft";
import { orchestrateDescribeImagesDraftsGroups } from "./orchestrateDescribeImagesDraftsGroups";
import { orchestrateDescribeImagesDraftsIntegrations } from "./orchestrateDescribeImagesDraftsIntegrations";

export const describeImages = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    content: string | AutoBeUserMessageContent | AutoBeUserMessageContent[];
  },
): Promise<AutoBeDescribeHistory> => {
  const start: Date = new Date();
  const step: number = ctx.state().analyze?.step ?? 0;
  const userMessage: AutoBeUserMessageContent[] =
    typeof props.content === "string"
      ? [{ type: "text", text: props.content }]
      : Array.isArray(props.content)
        ? props.content
        : [props.content];
  if (userMessage.some((m) => m.type === "image") === false) {
    throw new Error("No image content found in the user message.");
  }

  // Emit describe start event
  const imageCount = userMessage.filter((m) => m.type === "image").length;
  ctx.dispatch({
    type: "describeStart",
    id: v7(),
    imageCount,
    step,
    created_at: new Date().toISOString(),
  });

  const drafts: AutoBeDescribeImageDraftEvent[] =
    await orchestrateDescribeImagesDrafts(ctx, { content: userMessage });

  const groups: AutoBeDescribeImageDraftGroup[] =
    await orchestrateDescribeImagesDraftsGroups(ctx, { drafts });

  // Process each group to create integrated sections
  // Process each group to create integrated sections
  const integrations: AutoBeDescribeImageDraftIntegrationEvent[] =
    await orchestrateDescribeImagesDraftsIntegrations(ctx, {
      groups,
    });

  const document: AutoBeDescribeImageDocumentEvent =
    await orchestrateDescribeImagesDocument(ctx, { integrations });

  // Update context state with the document event
  ctx.dispatch(document);

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

  await fs.promises.writeFile(
    path.join(__dirname, "describe-image.json"),
    JSON.stringify(drafts, null, 2),
  );

  return ctx.dispatch(complete);
};
