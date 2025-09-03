export type EventIconType =
  | "success"
  | "progress"
  | "warning"
  | "error"
  | "info"
  | "start";

export interface IEventIconProps {
  type: EventIconType;
  size?: number;
}

const ICON_CONFIGS = {
  success: {
    backgroundColor: "#4caf50",
    icon: (
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    ),
  },
  progress: {
    backgroundColor: "#4caf50",
    icon: (
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    ),
  },
  warning: {
    backgroundColor: "#f59e0b",
    icon: <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />,
  },
  error: {
    backgroundColor: "#ef4444",
    icon: (
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 6L12 10.5 8.5 8 7 9.5 10.5 12 7 15.5 8.5 17 12 13.5 15.5 17 17 15.5 13.5 12 17 8.5 15.5 7z" />
    ),
  },
  info: {
    backgroundColor: "#3b82f6",
    icon: (
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    ),
  },
  start: {
    backgroundColor: "#10b981",
    icon: <path d="M8 5v14l11-7z" />,
  },
} as const;

/**
 * Common event icon component Provides consistent icon styling across all event
 * components
 */
export const EventIcon = (props: IEventIconProps) => {
  const { type, size = 16 } = props;
  const config = ICON_CONFIGS[type];

  return (
    <div
      style={{
        width: "2rem",
        height: "2rem",
        backgroundColor: config.backgroundColor,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{ color: "#ffffff" }}
      >
        {config.icon}
      </svg>
    </div>
  );
};

export default EventIcon;
