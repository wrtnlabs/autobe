import { IAutoBeAgentSession } from "../../structure";
import { CompactSessionIndicator } from "./CompactSessionIndicator";

export function CompactSessionList(props: CompactSessionList.IProps) {
  //----
  // VARIABLES
  //----
  const maxItems = props.maxItems ?? 8;
  const displaySessions = props.sessions.slice(0, maxItems);
  const remainingCount = props.sessions.length - maxItems;

  //----
  // STYLES
  //----
  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  };

  const remainingIndicatorStyle: React.CSSProperties = {
    width: "36px",
    height: "36px",
    borderRadius: "0.5rem",
    backgroundColor: "#f3f4f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto",
    color: "#6b7280",
    fontSize: "0.75rem",
    fontWeight: "500",
  };

  //----
  // RENDER
  //----
  return (
    <div style={containerStyle}>
      {displaySessions.map((session) => (
        <CompactSessionIndicator
          key={session.id}
          session={session}
          isActive={session.id === props.activeSessionId}
          onSelect={props.onSessionSelect}
        />
      ))}
      {remainingCount > 0 && (
        <div
          style={remainingIndicatorStyle}
          title={`+${remainingCount} more conversations`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}

export namespace CompactSessionList {
  export interface IProps {
    /** List of sessions to display */
    sessions: IAutoBeAgentSession[];

    /** Currently active session ID */
    activeSessionId?: string | null;

    /**
     * Maximum number of sessions to display
     *
     * @default 8
     */
    maxItems?: number;

    /**
     * Callback when a session is selected
     *
     * @param sessionId - ID of the selected session
     */
    onSessionSelect?: (sessionId: string) => void;
  }
}
