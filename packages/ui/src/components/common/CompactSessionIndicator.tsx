import { IAutoBeAgentSession } from "../../structure";

export function CompactSessionIndicator(props: CompactSessionIndicator.IProps) {
  //----
  // EVENT HANDLERS
  //----
  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!props.isActive) {
      e.currentTarget.style.backgroundColor = "#e5e7eb";
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!props.isActive) {
      e.currentTarget.style.backgroundColor = "#f3f4f6";
    }
  };

  const handleClick = () => {
    props.onSelect?.(props.session.id);
  };

  //----
  // STYLES
  //----
  const indicatorStyle: React.CSSProperties = {
    width: "36px",
    height: "36px",
    borderRadius: "0.5rem",
    backgroundColor: props.isActive ? "#3b82f6" : "#f3f4f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s ease",
    margin: "0 auto",
    color: props.isActive ? "#ffffff" : "#6b7280",
    fontSize: "0.875rem",
    fontWeight: "500",
  };

  //----
  // RENDER
  //----
  return (
    <div
      style={indicatorStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      title={props.session.title}
    >
      {props.session.title.charAt(0).toUpperCase()}
    </div>
  );
}

export namespace CompactSessionIndicator {
  export interface IProps {
    /** Session data to display */
    session: IAutoBeAgentSession;

    /** Whether this session is currently active */
    isActive: boolean;

    /**
     * Callback when session indicator is clicked
     *
     * @param sessionId - ID of the selected session
     */
    onSelect?: (sessionId: string) => void;
  }
}
