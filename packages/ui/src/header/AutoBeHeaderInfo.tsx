import { useState } from "react";

import { useAutoBeAgent } from "../context/AutoBeAgentContext";

const formatModel = (model: string): string =>
  model
    .replaceAll("-", " ")
    .replaceAll("/", " ")
    .replace("openai", "OpenAI")
    .replace("anthropic", "Anthropic")
    .replace("gemini", "Gemini")
    .replace("google", "Google")
    .replace("custom", "Custom")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export const AutoBeHeaderInfo = () => {
  const { header } = useAutoBeAgent();
  const [isExpanded, setIsExpanded] = useState(false);

  const getVendorIcon = (model: string): string => {
    if (model.startsWith("gpt")) return "🤖";
    if (model.startsWith("claude")) return "🔮";
    if (model.startsWith("gemini")) return "💎";
    return "🧠";
  };

  const getVendorName = (model: string): string => {
    if (model.startsWith("gpt")) return "OpenAI";
    if (model.startsWith("claude")) return "Anthropic";
    if (model.startsWith("gemini")) return "Google";
    return "Custom";
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "5rem",
        right: "2rem",
        zIndex: 1001,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(10px)",
        borderRadius: "12px",
        border: "1px solid #e5e7eb",
        boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.12)",
        minWidth: "200px",
        fontSize: "0.8rem",
        color: "#374151",
        cursor: "pointer",
        transition: "all 0.2s ease",
      }}
      onClick={() => setIsExpanded(!isExpanded)}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow = "0px 12px 32px rgba(0, 0, 0, 0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0px 8px 24px rgba(0, 0, 0, 0.12)";
      }}
    >
      <div
        style={{
          padding: "12px 16px",
        }}
      >
        {/* Compact View */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "1rem" }}>
              {getVendorIcon(header.vendor.model)}
            </span>
            <div>
              <div style={{ fontWeight: "600", fontSize: "0.85rem" }}>
                {formatModel(header.vendor.model)}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#6b7280" }}>
                {getVendorName(header.vendor.model)} •{" "}
                {header.locale.toUpperCase()} •{" "}
                {header.timezone.split("/").pop()}
              </div>
            </div>
          </div>
          <div
            style={{
              fontSize: "0.7rem",
              color: "#9ca3af",
              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          >
            ▼
          </div>
        </div>

        {/* Expanded View */}
        {isExpanded && (
          <div
            style={{
              marginTop: "12px",
              paddingTop: "12px",
              borderTop: "1px solid #f3f4f6",
              gap: "8px",
            }}
          >
            <div style={{ marginBottom: "8px" }}>
              <div style={{ fontWeight: "500", marginBottom: "4px" }}>
                Configuration
              </div>
              <div style={{ fontSize: "0.7rem", color: "#6b7280" }}>
                <div style={{ marginBottom: "2px" }}>
                  <strong>Schema Model:</strong> {header.model}
                </div>
                <div style={{ marginBottom: "2px" }}>
                  <strong>Model:</strong> {header.vendor.model}
                </div>
                <div style={{ marginBottom: "2px" }}>
                  <strong>Endpoint:</strong>{" "}
                  {header.vendor.baseURL
                    ? header.vendor.baseURL
                        .replace("https://", "")
                        .replace("http://", "")
                    : "api.openai.com/v1"}
                </div>
                <div style={{ marginBottom: "2px" }}>
                  <strong>Concurrency:</strong> {header.vendor.semaphore ?? 16}
                </div>
              </div>
            </div>

            <div>
              <div style={{ fontWeight: "500", marginBottom: "4px" }}>
                Localization
              </div>
              <div style={{ fontSize: "0.7rem", color: "#6b7280" }}>
                <div style={{ marginBottom: "2px" }}>
                  <strong>Language:</strong> {header.locale}
                </div>
                <div>
                  <strong>Timezone:</strong> {header.timezone}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AutoBeHeaderInfo;
