import { AutoBeEvent } from "@autobe/interface";
import { ReactNode } from "react";

import { ValidateEventGroup } from "../groups";
import { ValidateEvent } from "../groups/ValidateEventGroup";

/** Configuration for event grouping */
export interface IEventGrouperConfig {
  /** Minimum number of events to form a group (default: 2) */
  minGroupSize?: number;
  /** Whether groups should be collapsed by default (default: true) */
  defaultCollapsed?: boolean;
  /** Whether to group events at all (default: true) */
  enableGrouping?: boolean;
}

/**
 * Groups events by type and renders appropriate group components
 *
 * @param events Array of AutoBe events to group
 * @param config Configuration options for grouping
 * @returns Array of ReactNode components (grouped or individual)
 */
export function groupEvents(
  events: AutoBeEvent[],
  config: IEventGrouperConfig = {},
): ReactNode[] {
  const {
    minGroupSize = 2,
    defaultCollapsed = true,
    enableGrouping = true,
  } = config;

  if (!enableGrouping) {
    // Return individual event components without grouping
    return events.map((event, index) => (
      <div key={`${event.type}-${index}`}>{renderIndividualEvent(event)}</div>
    ));
  }

  // Group events by category
  const groupedEvents = groupEventsByCategory(events);
  const components: ReactNode[] = [];

  // Validation Events
  if (groupedEvents.validate.length >= minGroupSize) {
    components.push(
      <ValidateEventGroup
        key="validate-group"
        events={groupedEvents.validate}
        defaultCollapsed={defaultCollapsed}
      />,
    );
  } else {
    groupedEvents.validate.forEach((event, index) => {
      components.push(
        <div key={`validate-${index}`}>{renderIndividualEvent(event)}</div>,
      );
    });
  }

  // All other events (ungrouped)
  groupedEvents.other.forEach((event, index) => {
    components.push(
      <div key={`other-${index}`}>{renderIndividualEvent(event)}</div>,
    );
  });

  return components;
}

/** Groups events by their category */
function groupEventsByCategory(events: AutoBeEvent[]) {
  const grouped = {
    validate: [] as ValidateEvent[],
    other: [] as AutoBeEvent[],
  };

  events.forEach((event) => {
    switch (event.type) {
      // Validation events
      case "prismaValidate":
      case "testValidate":
      case "realizeValidate":
      case "realizeAuthorizationValidate":
      case "prismaInsufficient":
      case "interfaceComplement":
      case "interfaceOperationsReview":
        grouped.validate.push(event);
        break;

      default:
        grouped.other.push(event);
        break;
    }
  });

  return grouped;
}

/** Renders individual event components based on event type */
function renderIndividualEvent(event: AutoBeEvent): ReactNode {
  // This would import and use the actual event components
  // For now, returning a placeholder
  return (
    <div
      style={{
        padding: "1rem",
        border: "1px solid #e2e8f0",
        borderRadius: "0.5rem",
        marginBottom: "0.5rem",
      }}
    >
      <strong>{event.type}</strong> - {event.created_at}
    </div>
  );
}

export default groupEvents;
