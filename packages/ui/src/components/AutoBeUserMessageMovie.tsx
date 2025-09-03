import { AutoBeUserMessageContent } from "@autobe/interface";

import ChatBubble from "./common/ChatBubble";

interface IAutoBeUserMessageHistoryMovieProps {
  message: Array<AutoBeUserMessageContent>;
}

export const AutoBeUserMessageMovie = (
  props: IAutoBeUserMessageHistoryMovieProps,
) => {
  const { message } = props;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <ChatBubble content={message} direction="right" assistantName="You" />
    </div>
  );
};

export default AutoBeUserMessageMovie;
