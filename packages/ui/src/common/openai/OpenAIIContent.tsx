import { AutoBeUserMessageContent } from "@autobe/interface";

import { OpenAIUserAudioContent } from "./OpenAIUserAudioContent";
import { OpenAIUserFileContent } from "./OpenAIUserFileContent";
import { OpenAIUserImageContent } from "./OpenAIUserImageContent";
import { OpenAIUserTextContent } from "./OpenAIUserTextContent";

export interface IOpenAIUserContentProps {
  content: Array<AutoBeUserMessageContent | string>;
}

export const OpenAIContent = (props: IOpenAIUserContentProps) => {
  const { content } = props;

  /** Renders a single content item */
  const renderSingleContent = (
    item: AutoBeUserMessageContent | string,
    index: number,
  ) => {
    if (typeof item === "string") {
      return <OpenAIUserTextContent key={index} text={item} />;
    }

    switch (item.type) {
      case "text":
        return <OpenAIUserTextContent key={index} text={item.text} />;
      case "audio":
        return <OpenAIUserAudioContent key={index} content={item} />;
      case "file":
        return <OpenAIUserFileContent key={index} content={item} />;
      case "image":
        return <OpenAIUserImageContent key={index} content={item} />;
      default:
        return (
          <OpenAIUserTextContent key={index} text="Unsupported content type" />
        );
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
      }}
    >
      {content.map((item, index) => renderSingleContent(item, index))}
    </div>
  );
};

export default OpenAIContent;
