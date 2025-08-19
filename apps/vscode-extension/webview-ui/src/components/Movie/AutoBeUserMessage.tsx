import {
  AutoBeUserMessageContent,
  AutoBeUserMessageHistory,
  AutoBeUserMessageTextContent,
} from "@autobe/interface";

import ChatBubble from "../ChatBubble";

interface IAutoBeUserMessageHistoryMovieProps {
  message: Array<AutoBeUserMessageContent>;
}

const AutoBeUserMessage = (props: IAutoBeUserMessageHistoryMovieProps) => {
  const { message } = props;

  const textContent = message.filter(
    (v) => v.type === "text",
  ) as AutoBeUserMessageTextContent[];

  return (
    <div className="space-y-2">
      {textContent.map((content, index) => (
        <ChatBubble key={index} content={content.text} type="user" />
      ))}
    </div>
  );
};

export default AutoBeUserMessage;
