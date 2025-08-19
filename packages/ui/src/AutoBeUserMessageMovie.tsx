import {
  AutoBeUserMessageContent,
  AutoBeUserMessageTextContent,
} from "@autobe/interface";

import ChatBubble from "./common/ChatBubble";

interface IAutoBeUserMessageHistoryMovieProps {
  message: Array<AutoBeUserMessageContent>;
}

const AutoBeUserMessageMovie = (props: IAutoBeUserMessageHistoryMovieProps) => {
  const { message } = props;

  const textContent = message.filter(
    (v) => v.type === "text",
  ) as AutoBeUserMessageTextContent[];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {textContent.map((content, index) => (
        <ChatBubble
          key={index}
          content={content.text}
          direction="right"
          assistantName="You"
        />
      ))}
    </div>
  );
};

export default AutoBeUserMessageMovie;
