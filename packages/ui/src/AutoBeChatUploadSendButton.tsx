/** Props interface for AutoBeChatUploadSendButton component */
interface IAutoBeChatUploadSendButtonProps {
  /** Function to trigger conversation */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => Promise<void>;
  /** Whether the button is enabled */
  enabled: boolean;
}

/**
 * Chat upload send button component for triggering conversations
 *
 * @param props - Component props
 * @returns JSX element representing the send button
 */
export const AutoBeChatUploadSendButton = (
  props: IAutoBeChatUploadSendButtonProps,
) => {
  const baseStyles: React.CSSProperties = {
    padding: "6px",
    border: "none",
    borderRadius: "50%", // 4px에서 50%로 변경하여 둥글게
    backgroundColor: props.enabled ? "#1976d2" : "#e0e0e0",
    color: props.enabled ? "#ffffff" : "#9e9e9e",
    cursor: props.enabled ? "pointer" : "not-allowed",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background-color 0.3s ease",
    outline: "none",
    width: "32px",
    height: "32px",
  };

  const hoverStyles: React.CSSProperties = {
    ...baseStyles,
    backgroundColor: props.enabled ? "#1565c0" : "#e0e0e0",
  };

  return (
    <button
      style={baseStyles}
      onClick={(e) => void props.onClick?.(e)}
      disabled={!props.enabled}
      onMouseEnter={(e) => {
        if (props.enabled) {
          Object.assign(e.currentTarget.style, hoverStyles);
        }
      }}
      onMouseLeave={(e) => {
        Object.assign(e.currentTarget.style, baseStyles);
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{ display: "block" }}
      >
        <path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.59 5.58L20 12l-8-8-8 8z" />
      </svg>
    </button>
  );
};

export default AutoBeChatUploadSendButton;
