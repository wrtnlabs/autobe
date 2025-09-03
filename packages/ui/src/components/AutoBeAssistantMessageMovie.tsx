import ChatBubble from "./common/ChatBubble";

interface IAssistantMessageProps {
  text: string;
  isoTimestamp?: string; // ISO format: "2025-08-13T04:45:20.341Z"
  assistantName?: string;
}

export const AutoBeAssistantMessageMovie = (props: IAssistantMessageProps) => {
  const { text, isoTimestamp, assistantName = "AutoBe" } = props;

  return (
    <ChatBubble
      content={[text]}
      direction="left"
      timestamp={isoTimestamp}
      assistantName={assistantName}
    />
  );
};

export default AutoBeAssistantMessageMovie;
