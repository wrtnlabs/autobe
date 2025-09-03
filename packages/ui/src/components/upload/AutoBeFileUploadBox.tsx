import { ReactNode, useState } from "react";

export interface IAutoBeFileUploadBoxProps {
  extensionError: ReactNode | null;
  onClick: () => void;
  enabled: boolean;
}

export const AutoBeFileUploadBox = (props: IAutoBeFileUploadBoxProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const hasError = !!props.extensionError;

  const getButtonStyles = () => {
    const baseStyles = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "40px",
      height: "40px",
      padding: "0",
      border: "1px solid",
      borderRadius: "50%",
      cursor: props.enabled ? "pointer" : "not-allowed",
      backgroundColor: hasError ? "#fef2f2" : "transparent",
      borderColor: hasError ? "#f87171" : isHovered ? "#3b82f6" : "#d1d5db",
      opacity: props.enabled ? 1 : 0.5,
      transition: "all 0.3s ease",
      position: "relative" as const,
    };

    if (isHovered && props.enabled) {
      return {
        ...baseStyles,
        backgroundColor: hasError ? "#fef2f2" : "#f3f4f6",
        borderColor: hasError ? "#f87171" : "#3b82f6",
      };
    }

    return baseStyles;
  };

  const iconColor = hasError ? "#ef4444" : "#6b7280";

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={props.onClick}
        disabled={!props.enabled}
        style={getButtonStyles()}
        onMouseEnter={() => {
          setIsHovered(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
        }}
      >
        {hasError ? (
          // Error Icon (SVG)
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{ color: iconColor }}
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
        ) : (
          // Add Icon (SVG)
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{ color: iconColor }}
          >
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
        )}
      </button>

      {/* Custom Tooltip - Always show when there's an error */}
      {hasError && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            marginBottom: "8px",
            padding: "8px 12px",
            backgroundColor: "#ef4444",
            color: "#ffffff",
            borderRadius: "6px",
            fontSize: "14px",
            whiteSpace: "nowrap",
            zIndex: 1000,
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
          }}
        >
          {props.extensionError}
          {/* Tooltip Arrow */}
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "6px solid #ef4444",
            }}
          />
        </div>
      )}
    </div>
  );
};

export default AutoBeFileUploadBox;
