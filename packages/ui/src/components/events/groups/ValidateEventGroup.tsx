import {
  AutoBeInterfaceComplementEvent,
  AutoBeInterfaceOperationsReviewEvent,
  AutoBePrismaInsufficientEvent,
  AutoBePrismaValidateEvent,
  AutoBeRealizeAuthorizationValidateEvent,
  AutoBeRealizeValidateEvent,
  AutoBeTestValidateEvent,
} from "@autobe/interface";

import { AutoBeValidateEventMovie } from "../AutoBeValidateEventMovie";
import { CollapsibleEventGroup } from "../common/CollapsibleEventGroup";

export type ValidateEvent =
  | AutoBePrismaInsufficientEvent
  | AutoBePrismaValidateEvent
  | AutoBeInterfaceOperationsReviewEvent
  | AutoBeInterfaceComplementEvent
  | AutoBeTestValidateEvent
  | AutoBeRealizeValidateEvent
  | AutoBeRealizeAuthorizationValidateEvent;

export interface IValidateEventGroupProps {
  events: ValidateEvent[];
  defaultCollapsed?: boolean;
}

/**
 * Specialized group component for validation events Shows validation summary
 * and error statistics
 */
export const ValidateEventGroup = (props: IValidateEventGroupProps) => {
  const { events, defaultCollapsed = true } = props;

  if (events.length === 0) {
    return null;
  }

  // Calculate validation statistics
  const errorEvents = events.filter((event) => {
    switch (event.type) {
      case "prismaValidate":
      case "realizeValidate":
      case "prismaInsufficient":
        return true;
      case "testValidate":
      case "realizeAuthorizationValidate":
        return event.result.type !== "success";
      case "interfaceOperationsReview":
      case "interfaceComplement":
        return false;
      default:
        return false;
    }
  }).length;

  const successEvents = events.length - errorEvents;
  const eventTypes = Array.from(new Set(events.map((e) => e.type)));

  const renderSummary = (events: ValidateEvent[]) => (
    <>
      Validation and review events from various components
      <br />
      <br />
      <strong>Success Rate:</strong>{" "}
      {events.length > 0
        ? Math.round((successEvents / events.length) * 100)
        : 0}
      %
      <br />
      <strong>Successful:</strong> {successEvents} events
      <br />
      <strong>Failed/Issues:</strong> {errorEvents} events
      <br />
      <strong>Event Types:</strong> {eventTypes.join(", ")}
      <br />
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
              backgroundColor: "#4caf50",
              borderRadius: "2px",
            }}
          />
          <span style={{ fontSize: "0.75rem" }}>Success: {successEvents}</span>
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
              backgroundColor: "#f59e0b",
              borderRadius: "2px",
            }}
          />
          <span style={{ fontSize: "0.75rem" }}>Issues: {errorEvents}</span>
        </div>
      </div>
    </>
  );

  const getGroupIconType = () => {
    if (errorEvents === 0) return "success"; // All successful
    if (successEvents === 0) return "warning"; // All failed
    return "warning"; // Mixed results
  };

  const getGroupVariant = () => {
    if (errorEvents === 0) return "success"; // All successful
    if (successEvents === 0) return "warning"; // All failed
    return "warning"; // Mixed results
  };

  return (
    <CollapsibleEventGroup
      events={events}
      title="Validation Events"
      iconType={getGroupIconType()}
      variant={getGroupVariant()}
      getTimestamp={(event) => event.created_at}
      renderEvent={(event) => <AutoBeValidateEventMovie event={event} />}
      renderSummary={renderSummary}
      defaultCollapsed={defaultCollapsed}
      description="Validation and review events"
    />
  );
};

export default ValidateEventGroup;
