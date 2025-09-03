import {
  AutoBePrismaCorrectEvent,
  AutoBeRealizeAuthorizationCorrectEvent,
  AutoBeRealizeCorrectEvent,
  AutoBeTestCorrectEvent,
} from "@autobe/interface";

import { AutoBeCorrectEventMovie } from "../AutoBeCorrectEventMovie";
import { CollapsibleEventGroup } from "../common/CollapsibleEventGroup";

type CorrectEvent =
  | AutoBePrismaCorrectEvent
  | AutoBeTestCorrectEvent
  | AutoBeRealizeCorrectEvent
  | AutoBeRealizeAuthorizationCorrectEvent;

export interface ICorrectEventGroupProps {
  events: CorrectEvent[];
  defaultCollapsed?: boolean;
}

/**
 * Specialized group component for correction events Shows correction summary
 * and statistics
 */
export const CorrectEventGroup = (props: ICorrectEventGroupProps) => {
  const { events, defaultCollapsed = true } = props;

  if (events.length === 0) {
    return null;
  }

  // Calculate correction statistics
  const eventTypes = Array.from(new Set(events.map((e) => e.type)));
  const eventTypeCounts = eventTypes.reduce(
    (acc, type) => {
      acc[type] = events.filter((e) => e.type === type).length;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Get latest step numbers for each event type
  const latestSteps = eventTypes.reduce(
    (acc, type) => {
      const eventsOfType = events.filter((e) => e.type === type);
      acc[type] = Math.max(...eventsOfType.map((e) => e.step));
      return acc;
    },
    {} as Record<string, number>,
  );

  const renderSummary = (events: CorrectEvent[]) => (
    <>
      Correction events showing AI self-improvement feedback loop
      <br />
      <br />
      <strong>Success Rate:</strong> 100% (All corrections applied successfully)
      <br />
      <strong>Total Corrections:</strong> {events.length} events
      <br />
      <strong>Event Types:</strong> {eventTypes.join(", ")}
      <br />
      <br />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        {eventTypes.map((type) => {
          const typeDisplayNames = {
            prismaCorrect: "🗄️ Database Schema",
            testCorrect: "🧪 Test Suite",
            realizeCorrect: "⚙️ Implementation",
            realizeAuthorizationCorrect: "🔐 Authorization",
          };

          return (
            <div
              key={type}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.5rem",
                backgroundColor: "#f0fdf4",
                borderRadius: "0.25rem",
                border: "1px solid #bbf7d0",
              }}
            >
              <span style={{ fontSize: "0.75rem", fontWeight: "500" }}>
                {typeDisplayNames[type as keyof typeof typeDisplayNames] ||
                  type}
              </span>
              <div
                style={{ display: "flex", gap: "1rem", alignItems: "center" }}
              >
                <span style={{ fontSize: "0.75rem", color: "#16a34a" }}>
                  {eventTypeCounts[type]} corrections
                </span>
                <span
                  style={{
                    fontSize: "0.625rem",
                    color: "#64748b",
                    fontFamily: "monospace",
                    backgroundColor: "#e2e8f0",
                    padding: "0.125rem 0.375rem",
                    borderRadius: "0.25rem",
                  }}
                >
                  Step {latestSteps[type]}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <br />
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          <div
            style={{
              width: "12px",
              height: "12px",
              backgroundColor: "#16a34a",
              borderRadius: "2px",
            }}
          />
          <span style={{ fontSize: "0.75rem" }}>
            Corrected: {events.length}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          <div
            style={{
              width: "12px",
              height: "12px",
              backgroundColor: "#10b981",
              borderRadius: "2px",
            }}
          />
          <span style={{ fontSize: "0.75rem" }}>Self-Improvement Active</span>
        </div>
      </div>
    </>
  );

  return (
    <CollapsibleEventGroup
      events={events}
      title="Correction Events"
      iconType="success"
      variant="success"
      getTimestamp={(event) => event.created_at}
      renderEvent={(event) => <AutoBeCorrectEventMovie event={event} />}
      renderSummary={renderSummary}
      defaultCollapsed={defaultCollapsed}
      description="AI self-correction and improvement events"
    />
  );
};

export default CorrectEventGroup;
