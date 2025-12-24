import {
  AutoBeUserConversateContent,
  AutoBeUserMessageHistory,
} from "@autobe/interface";
import { v7 } from "uuid";

import { AutoBeContext } from "../context/AutoBeContext";
import { createAutoBeUserMessageContent } from "../factory/createAutoBeMessageContent";
import { imageDescribe } from "./imageDescribe";

export const describe = async (
  ctx: AutoBeContext,
  props: {
    content:
      | string
      | AutoBeUserConversateContent
      | AutoBeUserConversateContent[];
  },
): Promise<AutoBeUserMessageHistory> => {
  if (typeof props.content === "string")
    return {
      type: "userMessage",
      id: v7(),
      contents: [
        {
          type: "text",
          text: props.content,
        },
      ],
      created_at: new Date().toISOString(),
    };

  const contents: AutoBeUserConversateContent[] = Array.isArray(props.content)
    ? props.content
    : [props.content];

  if (contents.some((c) => c.type === "image"))
    return await imageDescribe(ctx, { content: contents });
  return {
    type: "userMessage",
    id: v7(),
    contents: contents.map((c) =>
      createAutoBeUserMessageContent({ content: c }),
    ),
    created_at: new Date().toISOString(),
  };
};
