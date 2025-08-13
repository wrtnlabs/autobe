import React from "react";

interface IChatBubbleProps {
  /** 메시지 내용 */
  content: string;
  /** 메시지 타입 - user(사용자) 또는 assistant(어시스턴트) */
  type: "user" | "assistant";
  /** 타임스탬프 (ISO 형식) */
  timestamp?: string;
  /** 어시스턴트 이름 (기본값: "Assistant") */
  assistantName?: string;
}

const ChatBubble = (props: IChatBubbleProps) => {
  const { content, type, timestamp, assistantName = "Assistant" } = props;

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const isUser = type === "user";

  return (
    <div className={`flex mb-4 ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex flex-col max-w-3xl ${isUser ? "items-end" : "items-start"}`}
      >
        {/* 사용자 이름/시간 */}
        <div className={`mb-1 ${isUser ? "text-right" : "text-left"}`}>
          <span className="text-xs text-gray-500">
            {isUser ? "You" : assistantName}
            {timestamp && (
              <>
                <span className="mx-1">•</span>
                {formatTime(timestamp)}
              </>
            )}
          </span>
        </div>

        {/* 메시지 버블 */}
        <div
          className={`
            relative max-w-lg px-4 py-3 rounded-2xl shadow-sm
            ${
              isUser
                ? "bg-blue-500 text-white rounded-tr-md"
                : "bg-gray-100 text-gray-800 rounded-tl-md border border-gray-200"
            }
          `}
        >
          {/* 버블 꼬리 */}
          <div
            className={`
              absolute w-3 h-3 transform rotate-45
              ${
                isUser
                  ? "bg-blue-500 -right-1 top-3"
                  : "bg-gray-100 border-l border-b border-gray-200 -left-1 top-3"
              }
            `}
          />

          {/* 메시지 내용 */}
          <div className="relative z-10 text-sm whitespace-pre-wrap leading-relaxed">
            {content}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
