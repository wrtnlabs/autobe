import {
  AgenticaUserMessageAudioContent,
  AgenticaUserMessageContent,
  AgenticaUserMessageFileContent,
  AgenticaUserMessageImageContent,
  AgenticaUserMessageTextContent,
} from "@agentica/core";
import { AutoBeUserMessageContent } from "@autobe/interface";

export function createAgenticaUserMessageContent(props: {
  content: string | AutoBeUserMessageContent | AutoBeUserMessageContent[];
}): AgenticaUserMessageContent[] {
  const contents: AutoBeUserMessageContent[] =
    typeof props.content === "string"
      ? [
          {
            type: "text",
            text: props.content,
          },
        ]
      : Array.isArray(props.content)
        ? props.content
        : [props.content];

  const result: AgenticaUserMessageContent[] = [];
  for (const c of contents) {
    if (c.type === "image") {
      c.images.forEach((image) => {
        result.push({
          type: "image",
          image,
        } satisfies AgenticaUserMessageImageContent);
      });
      result.push({
        type: "text",
        text: c.description,
      });
    } else if (c.type === "text") {
      result.push({
        type: "text",
        text: c.text,
      } satisfies AgenticaUserMessageTextContent);
    } else if (c.type === "file") {
      result.push({
        type: "file",
        file: c.file,
      } satisfies AgenticaUserMessageFileContent);
    } else if (c.type === "audio") {
      result.push({
        type: "audio",
        data: c.data,
        format: c.format,
      } satisfies AgenticaUserMessageAudioContent);
    } else {
      c satisfies never;
    }
  }
  return result;
}
