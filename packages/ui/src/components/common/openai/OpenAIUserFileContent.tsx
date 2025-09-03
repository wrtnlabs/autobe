import { AutoBeUserMessageFileContent } from "@autobe/interface";

/** File content renderer component for OpenAI messages */
export const OpenAIUserFileContent = ({
  content,
}: {
  content: AutoBeUserMessageFileContent;
}) => {
  const isRight = true; // UserContent는 항상 오른쪽
  const fileName =
    content.file.type === "base64"
      ? content.file.name
      : `File ID: ${content.file.id}`;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        minWidth: "8rem",
        minHeight: "6rem",
      }}
    >
      {/* File Icon */}
      <div
        style={{
          width: "2.5rem",
          height: "2.5rem",
          borderRadius: "0.5rem",
          backgroundColor: isRight ? "rgba(255,255,255,0.2)" : "#10b981",
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
          style={{ color: "#ffffff" }}
        >
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
        </svg>
      </div>
      <div
        style={{
          fontSize: "0.7rem",
          fontWeight: "bold",
          color: isRight ? "rgba(255,255,255,0.9)" : "#6b7280",
          textAlign: "center",
          marginBottom: "0.25rem",
        }}
      >
        {fileName.split(".").at(-1)?.toUpperCase()} FILE
      </div>
      <div
        style={{
          fontSize: "0.65rem",
          color: isRight ? "rgba(255,255,255,0.7)" : "#9ca3af",
          textAlign: "center",
          wordBreak: "break-all",
          maxWidth: "8rem",
        }}
      >
        {fileName}
      </div>
    </div>
  );
};

export default OpenAIUserFileContent;
