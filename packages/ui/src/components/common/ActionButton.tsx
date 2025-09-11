export function ActionButton(props: ActionButton.IProps) {
  //----
  // STYLES
  //----
  const baseButtonStyle: React.CSSProperties = {
    background: "rgba(255, 255, 255, 0.9)",
    border: "1px solid rgba(0, 0, 0, 0.1)",
    cursor: "pointer",
    padding: "0.25rem",
    borderRadius: "0.375rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#4b5563",
    transition: "all 0.2s ease",
    width: "1.5rem",
    height: "1.5rem",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
  };

  const getHoverColors = (variant: ActionButton.Variant) => {
    switch (variant) {
      case "edit":
        return {
          backgroundColor: "#f1f5f9",
          color: "#475569",
          borderColor: "#cbd5e1",
          boxShadow: "0 2px 4px rgba(71, 85, 105, 0.12)",
        };
      case "delete":
        return {
          backgroundColor: "#fef2f2",
          color: "#dc2626",
          borderColor: "#fecaca",
          boxShadow: "0 2px 4px rgba(220, 38, 38, 0.15)",
        };
      case "save":
        return {
          backgroundColor: "#f0fdf4",
          color: "#22c55e",
          borderColor: "#bbf7d0",
          boxShadow: "0 2px 4px rgba(34, 197, 94, 0.15)",
        };
      case "cancel":
        return {
          backgroundColor: "#fff1f2",
          color: "#ef4444",
          borderColor: "#fecdd3",
          boxShadow: "0 2px 4px rgba(239, 68, 68, 0.15)",
        };
      default:
        return {
          backgroundColor: "#f1f5f9",
          color: "#475569",
          borderColor: "#cbd5e1",
          boxShadow: "0 2px 4px rgba(71, 85, 105, 0.12)",
        };
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    const hoverColors = getHoverColors(props.variant);
    e.currentTarget.style.backgroundColor = hoverColors.backgroundColor;
    e.currentTarget.style.color = hoverColors.color;
    e.currentTarget.style.borderColor = hoverColors.borderColor;
    e.currentTarget.style.boxShadow = hoverColors.boxShadow;
    e.currentTarget.style.transform = "translateY(-1px)";
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
    e.currentTarget.style.color = "#4b5563";
    e.currentTarget.style.borderColor = "rgba(0, 0, 0, 0.1)";
    e.currentTarget.style.boxShadow = "0 1px 2px rgba(0, 0, 0, 0.1)";
    e.currentTarget.style.transform = "translateY(0)";
  };

  //----
  // ICONS
  //----
  const renderIcon = () => {
    switch (props.variant) {
      case "edit":
        return (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="m18.5 2.5 a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
          </svg>
        );
      case "delete":
        return (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6L6 18" />
            <path d="M6 6l12 12" />
          </svg>
        );
      case "save":
        return (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20,6 9,17 4,12" />
          </svg>
        );
      case "cancel":
        return (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6L6 18" />
            <path d="M6 6l12 12" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (props.variant) {
      case "edit":
        return "Edit title";
      case "delete":
        return "Delete conversation";
      case "save":
        return "Save changes";
      case "cancel":
        return "Cancel editing";
      default:
        return "";
    }
  };

  //----
  // RENDER
  //----
  return (
    <button
      onClick={props.onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        ...baseButtonStyle,
        ...props.style,
      }}
      title={props.title ?? getTitle()}
      disabled={props.disabled}
    >
      {renderIcon()}
    </button>
  );
}

export namespace ActionButton {
  export type Variant = "edit" | "delete" | "save" | "cancel";

  export interface IProps {
    /** Button variant that determines icon and hover colors */
    variant: Variant;

    /** Click handler */
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;

    /** Custom title for tooltip */
    title?: string;

    /** Whether button is disabled */
    disabled?: boolean;

    /** Custom style overrides */
    style?: React.CSSProperties;
  }
}
