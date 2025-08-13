interface IAssistantMessageProps {
  text: string;
  timestamp?: string; // ISO format: "2025-08-13T04:45:20.341Z"
}

const AutoBeAssistantMessage = (props: IAssistantMessageProps) => {
  const { text, timestamp } = props;

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  return (
    <div className="flex justify-start mb-4">
      <div className="flex-1 max-w-3xl">
        {/* 메시지 버블 */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
          <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
            {text}
          </div>
        </div>

        {/* 시간 표시 */}
        <div className="mt-1 ml-1">
          <span className="text-xs text-gray-400">
            {timestamp ? formatTime(timestamp) : "Assistant"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AutoBeAssistantMessage;
