import ChatBubble from "../ChatBubble";

interface IAssistantMessageProps {
  text: string;
  timestamp?: string; // ISO format: "2025-08-13T04:45:20.341Z"
}

const AutoBeAssistantMessage = (props: IAssistantMessageProps) => {
  const { text, timestamp } = props;

  return (
    <ChatBubble
      content={text}
      type="assistant"
      timestamp={timestamp}
      assistantName="AutoBe"
    />
  );
};

export default AutoBeAssistantMessage;
