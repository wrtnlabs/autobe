interface IChatBubbleProps {
  /** Message content */
  content: string;

  /** Direction of the chat bubble - left or right */
  direction: "left" | "right";
  /** Timestamp (ISO format) */
  timestamp?: string;
  /** Assistant name (default: "Assistant") */
  assistantName?: string;
}

const ChatBubble = (props: IChatBubbleProps) => {
  const { content, direction, timestamp, assistantName = "Assistant" } = props;

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const isRight = direction === "right";

  return (
    <div
      style={{
        display: "flex",
        marginBottom: "1rem",
        justifyContent: isRight ? "flex-end" : "flex-start",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          maxWidth: "48rem",
          alignItems: isRight ? "flex-end" : "flex-start",
        }}
      >
        {/* User name/time */}
        <div
          style={{
            marginBottom: "0.25rem",
            textAlign: isRight ? "right" : "left",
          }}
        >
          <span
            style={{
              fontSize: "0.75rem",
              lineHeight: "1rem",
              color: "#6b7280",
            }}
          >
            {isRight ? "You" : assistantName}
            {timestamp && (
              <>
                <span
                  style={{
                    marginLeft: "0.25rem",
                    marginRight: "0.25rem",
                  }}
                >
                  •
                </span>
                {formatTime(timestamp)}
              </>
            )}
          </span>
        </div>

        {/* Message bubble */}
        <div
          style={{
            position: "relative",
            maxWidth: "32rem",
            paddingLeft: "1rem",
            paddingRight: "1rem",
            paddingTop: "0.75rem",
            paddingBottom: "0.75rem",
            borderRadius: "1rem",
            boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
            backgroundColor: isRight ? "#3b82f6" : "#f3f4f6",
            color: isRight ? "#ffffff" : "#1f2937",
            borderTopRightRadius: isRight ? "0.375rem" : "1rem",
            borderTopLeftRadius: isRight ? "1rem" : "0.375rem",
            border: isRight ? "none" : "1px solid #e5e7eb",
          }}
        >
          {/* Bubble tail */}
          <div
            style={{
              position: "absolute",
              width: "0.75rem",
              height: "0.75rem",
              transform: "rotate(45deg)",
              backgroundColor: isRight ? "#3b82f6" : "#f3f4f6",
              right: isRight ? "-0.25rem" : undefined,
              left: isRight ? undefined : "-0.25rem",
              top: "0.75rem",
              borderLeft: isRight ? "none" : "1px solid #e5e7eb",
              borderBottom: isRight ? "none" : "1px solid #e5e7eb",
            }}
          />

          {/* Message content */}
          <div
            style={{
              position: "relative",
              zIndex: 10,
              fontSize: "0.875rem",
              lineHeight: "1.625",
              whiteSpace: "pre-wrap",
            }}
          >
            {content}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
