import { ReactNode, useState } from "react";

import { EventCard } from "./EventCard";
import { EventContent } from "./EventContent";
import { EventIcon, EventIconType } from "./EventIcon";

export interface ICollapsibleEventGroupProps<T = unknown> {
  /** Array of events of the same type */
  events: T[];
  /** Title for the group */
  title: string;
  /** Icon type for the group header */
  iconType: EventIconType;
  /** Function to render individual events */
  renderEvent: (event: T, index: number) => ReactNode;
  /** Function to get timestamp from event (for header) */
  getTimestamp: (event: T) => string;
  /** Optional custom summary content */
  renderSummary?: (events: T[]) => ReactNode;
  /** Initial collapsed state */
  defaultCollapsed?: boolean;
  /** Custom group description */
  description?: string;
  /** Card variant based on event status */
  variant?: "default" | "success" | "error" | "warning";
}

/**
 * Collapsible event group component Groups multiple events of the same type
 * with expand/collapse functionality
 */
export const CollapsibleEventGroup = <T,>(
  props: ICollapsibleEventGroupProps<T>,
) => {
  const {
    events,
    title,
    iconType,
    renderEvent,
    getTimestamp,
    renderSummary,
    defaultCollapsed = true,
    description,
    variant = "default",
  } = props;

  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  if (events.length === 0) {
    return null;
  }

  // Use the latest event's timestamp for the group header
  const latestTimestamp = getTimestamp(events[events.length - 1]);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const defaultSummary = (
    <>
      {description && (
        <>
          {description}
          <br />
          <br />
        </>
      )}
      <strong>Total Events:</strong> {events.length}
      <br />
      <strong>Status:</strong> {isCollapsed ? "Collapsed" : "Expanded"}
    </>
  );

  return (
    <EventCard variant={variant}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <EventIcon type={iconType} />

          <div>
            <h3
              style={{
                fontSize: "1.125rem",
                fontWeight: "600",
                color: "#1e293b",
                margin: 0,
                marginBottom: "0.25rem",
              }}
            >
              {title}
            </h3>
            <div
              style={{
                fontSize: "0.75rem",
                color: "#64748b",
              }}
            >
              {events.length} event{events.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        <div
          style={{
            fontSize: "0.75rem",
            color: "#64748b",
            textAlign: "right",
          }}
        >
          {latestTimestamp}
        </div>
      </div>

      {/* Summary content when collapsed */}
      {isCollapsed && (
        <EventContent>
          {renderSummary ? renderSummary(events) : defaultSummary}
        </EventContent>
      )}

      {/* Individual events when expanded */}
      {!isCollapsed && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          {events.map((event, index) => (
            <div key={index}>{renderEvent(event, index)}</div>
          ))}
        </div>
      )}

      {/* Expand/Collapse Button */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "1rem",
        }}
      >
        <button
          onClick={toggleCollapse}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1rem",
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "0.5rem",
            cursor: "pointer",
            fontSize: "0.875rem",
            color: "#64748b",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f1f5f9";
            e.currentTarget.style.borderColor = "#cbd5e1";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#f8fafc";
            e.currentTarget.style.borderColor = "#e2e8f0";
          }}
        >
          <span>{isCollapsed ? "Expand" : "Collapse"}</span>
          <div
            style={{
              width: "1rem",
              height: "1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "transform 0.2s ease",
              transform: isCollapsed ? "rotate(0deg)" : "rotate(180deg)",
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="currentColor"
              style={{ color: "#64748b" }}
            >
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </div>
        </button>
      </div>
    </EventCard>
  );
};

export default CollapsibleEventGroup;
