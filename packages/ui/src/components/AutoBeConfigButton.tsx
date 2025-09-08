import { overlay } from "overlay-kit";
import { CSSProperties } from "react";

import AutoBeConfigModal, { IConfigField } from "./AutoBeConfigModal";

export interface IAutoBeConfigButtonProps {
  className?: string;
  style?: CSSProperties;
  title?: string;
  fields: IConfigField[];
  onSave?: () => void;
}

/**
 * A floating action button that opens the configuration modal Features hover
 * animations and a clean, modern design
 */
export const AutoBeConfigButton = (props: IAutoBeConfigButtonProps) => {
  return (
    <button
      onClick={() =>
        overlay.open(({ isOpen, close }) => (
          <AutoBeConfigModal
            isOpen={isOpen}
            onClose={close}
            fields={props.fields}
            onSave={() => {
              props.onSave?.();
            }}
          />
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
      title={props.title ?? "Configure Settings"}
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
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </button>
  );
};

export default AutoBeConfigButton;
