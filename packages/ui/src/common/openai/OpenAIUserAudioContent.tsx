import { AutoBeUserMessageAudioContent } from "@autobe/interface";

/** Audio content renderer component for OpenAI messages */
export const OpenAIUserAudioContent = ({
  content,
}: {
  content: AutoBeUserMessageAudioContent;
}) => {
  const isRight = true; // UserContent는 항상 오른쪽

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        minWidth: "6rem",
        minHeight: "6rem",
      }}
    >
      {/* Audio Icon */}
      <div
        style={{
          width: "2.5rem",
          height: "2.5rem",
          borderRadius: "50%",
          backgroundColor: isRight ? "rgba(255,255,255,0.2)" : "#3b82f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "0.5rem",
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="currentColor"
          style={{ color: isRight ? "#ffffff" : "#ffffff" }}
        >
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
      </div>
      <div
        style={{
          fontSize: "0.7rem",
          fontWeight: "bold",
          color: isRight ? "rgba(255,255,255,0.9)" : "#6b7280",
          textAlign: "center",
        }}
      >
        AUDIO
      </div>
      <div
        style={{
          fontSize: "0.65rem",
          color: isRight ? "rgba(255,255,255,0.7)" : "#9ca3af",
          textAlign: "center",
          marginTop: "0.25rem",
        }}
      >
        {content.format.toUpperCase()}
      </div>
    </div>
  );
};

export default OpenAIUserAudioContent;
