import { overlay } from "overlay-kit";
import { CSSProperties } from "react";

import AutoBeStatusModal from "./AutoBeStatusModal";

export interface IAutoBeStatusButtonProps {
  className?: string;
  style?: CSSProperties;
  title?: string;
}

/**
 * A floating action button that opens the system status modal Features hover
 * animations and a clean, modern design
 */
export const AutoBeStatusButton = (props: IAutoBeStatusButtonProps) => {
  return (
    <button
      onClick={() =>
        overlay.open(({ isOpen, close }) => (
          <AutoBeStatusModal isOpen={isOpen} onClose={close} />
        ))
      }
      className={props.className}
      style={{
        background: "#f8f9fa",
        color: "#495057",
        border: "1px solid #dee2e6",
        borderRadius: "50%",
        padding: "0.5rem",
        width: "2rem",
        height: "2rem",
        cursor: "pointer",
        fontSize: "0.85rem",
        fontWeight: "400",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        transition: "all 0.2s ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...props.style,
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.15)";
        e.currentTarget.style.background = "#e9ecef";
        e.currentTarget.style.borderColor = "#adb5bd";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
        e.currentTarget.style.background = "#f8f9fa";
        e.currentTarget.style.borderColor = "#dee2e6";
      }}
      title={props.title || "View System Status"}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
    </button>
  );
};

export default AutoBeStatusButton;
