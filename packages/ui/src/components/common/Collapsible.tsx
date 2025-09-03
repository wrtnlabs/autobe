import { ReactNode, useState } from "react";

import { COLORS } from "../../constant/color";

/** Props interface for Collapsible component */
interface ICollapsibleProps {
  /** Title to display in the header */
  title: string;
  /** Content to be collapsed/expanded */
  children: ReactNode;
  /** Initial collapsed state */
  defaultCollapsed?: boolean;
  /** Whether to show animation */
  animated?: boolean;
}

/** Reusable collapsible component with toggle functionality */
export const Collapsible = ({
  title,
  children,
  defaultCollapsed = false,
  animated = true,
}: ICollapsibleProps) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: isCollapsed ? "0" : "12px",
        }}
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "0",
            borderRadius: "1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: animated ? "background-color 0.2s" : "none",
            color: COLORS.GRAY_TEXT_MEDIUM,
            marginRight: "1rem",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.GRAY_BORDER_LIGHT;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{
              transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
              transition: animated ? "transform 0.2s ease" : "none",
            }}
          >
            <path d="M7.41 8.58L12 13.17l4.59-4.59L18 10l-6 6-6-6 1.41-1.42z" />
          </svg>
        </button>
        <h4
          style={{
            margin: 0,
            fontSize: "1rem",
            fontWeight: "600",
            color: COLORS.GRAY_TEXT_DARK,
          }}
        >
          {title}
        </h4>
      </div>
      {!isCollapsed && (
        <div
          style={{
            opacity: isCollapsed ? 0 : 1,
            transition: animated ? "opacity 0.2s ease" : "none",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default Collapsible;
