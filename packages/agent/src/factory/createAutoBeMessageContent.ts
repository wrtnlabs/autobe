import {
  AutoBeUserConversateContent,
  AutoBeUserMessageContent,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";

export function createAutoBeUserMessageContent(props: {
  content: AutoBeUserConversateContent;
  description?: string;
}): AutoBeUserMessageContent {
  const { content, description } = props;
  if (content.type === "image") {
    if (description !== undefined) {
      return {
        type: "text",
        text: StringUtil.trim`
          image description: 
          
          \`\`\`text
          ${description}
          \`\`\`
          `,
      };
    }
    return {
      type: "image",
      image: content.image,
      description: description ?? "",
    };
  } else if (content.type === "text") return content;
  else if (content.type === "file") return content;
  else if (content.type === "audio") return content;
  else content satisfies never;

  throw new Error(`Invalid content type`);
}
