import {
  AutoBeInterfaceComplementEvent,
  AutoBeInterfaceOperationsReviewEvent,
  AutoBePrismaInsufficientEvent,
  AutoBePrismaValidateEvent,
  AutoBeRealizeAuthorizationValidateEvent,
  AutoBeRealizeValidateEvent,
  AutoBeTestValidateEvent,
} from "@autobe/interface";
import { JSX } from "react";

import { EventCard, EventContent, EventHeader } from "./common";

export interface IAutoBeValidateEventMovieProps {
  event:
    | AutoBePrismaInsufficientEvent
    | AutoBePrismaValidateEvent
    | AutoBeInterfaceOperationsReviewEvent
    | AutoBeInterfaceComplementEvent
    | AutoBeTestValidateEvent
    | AutoBeRealizeValidateEvent
    | AutoBeRealizeAuthorizationValidateEvent;
}

export const AutoBeValidateEventMovie = (
  props: IAutoBeValidateEventMovieProps,
) => {
  const { event } = props;
  const { title, description, isError, step, isSuccess } = getState(event);

  const getCardVariant = () => {
    if (isSuccess) return "success";
    if (isError) return "error";
    return "warning";
  };

  const getIconType = () => {
    if (isSuccess) return "success";
    if (isError) return "error";
    return "warning";
  };

  return (
    <EventCard variant={getCardVariant()}>
      <EventHeader
        title={title}
        timestamp={event.created_at}
        iconType={getIconType()}
        step={step}
      />
      <EventContent>{description}</EventContent>
    </EventCard>
  );
};

export default AutoBeValidateEventMovie;

interface IState {
  title: string;
  description: string | JSX.Element;
  isError: boolean;
  isSuccess: boolean;
  step?: number;
}

function getState(event: IAutoBeValidateEventMovieProps["event"]): IState {
  switch (event.type) {
    case "prismaValidate":
      return {
        title: "Prisma Validation Failed",
        description: (
          <>
            Database schema validation encountered errors that require
            correction.
            <br />
            <br />
            <strong>Error Details:</strong>
            <br />
            {event.result.errors.length > 0 && (
              <>
                {event.result.errors
                  .slice(0, 3)
                  .map((error: any, idx: number) => (
                    <div key={idx} style={{ marginTop: "0.25rem" }}>
                      • {error.message}
                    </div>
                  ))}
              </>
            )}
            <br />
            <strong>Failed Schemas:</strong> {Object.keys(event.schemas).length}{" "}
            file(s)
          </>
        ),
        isError: true,
        isSuccess: false,
        step: event.step,
      };
    case "testValidate":
      const isTestSuccess = event.result.type === "success";
      return {
        title: isTestSuccess
          ? "Test Validation Successful"
          : "Test Validation Failed",
        description: (
          <>
            Test file validation completed.
            <br />
            <br />
            <strong>File:</strong> {event.file.location}
            <br />
            <strong>Status:</strong> {isTestSuccess ? "Success" : "Failed"}
            {!isTestSuccess && (
              <>
                <br />
                <br />
                <strong>Compilation Issues:</strong>
                <br />
                {event.result.type === "failure" &&
                  event.result.diagnostics
                    .slice(0, 3)
                    .map((diagnostic: any, idx: number) => (
                      <div key={idx} style={{ marginTop: "0.25rem" }}>
                        • {diagnostic.messageText}
                      </div>
                    ))}
                {event.result.type === "exception" && (
                  <div style={{ marginTop: "0.25rem" }}>
                    • Exception occurred during compilation
                  </div>
                )}
              </>
            )}
          </>
        ),
        isError: !isTestSuccess,
        isSuccess: isTestSuccess,
        step: event.step,
      };
    case "realizeValidate":
      return {
        title: "Implementation Validation Failed",
        description: (
          <>
            Implementation code compilation encountered errors that need
            correction.
            <br />
            <br />
            <strong>Failed Files:</strong> {Object.keys(event.files).length}{" "}
            file(s)
            <br />
            <br />
            <strong>Error Type:</strong>{" "}
            {event.result.type === "failure"
              ? "Compilation Error"
              : "Runtime Exception"}
            <br />
            {event.result.type === "failure" &&
              event.result.diagnostics.length > 0 && (
                <>
                  <br />
                  <strong>First Error:</strong>
                  <br />
                  {event.result.diagnostics[0].messageText}
                </>
              )}
          </>
        ),
        isError: true,
        isSuccess: false,
        step: event.step,
      };
    case "realizeAuthorizationValidate":
      const isAuthSuccess = event.result.type === "success";
      return {
        title: isAuthSuccess
          ? "Authorization Validation Successful"
          : "Authorization Validation Failed",
        description: (
          <>
            Authorization implementation validation completed.
            <br />
            <br />
            <strong>Role:</strong> {event.authorization.role.name}(
            {event.authorization.role.description})
            <br />
            <strong>Status:</strong> {isAuthSuccess ? "Success" : "Failed"}
            {!isAuthSuccess && (
              <>
                <br />
                <br />
                <strong>Validation Issues:</strong>
                <br />
                {event.result.type === "failure" &&
                  event.result.diagnostics
                    .slice(0, 2)
                    .map((diagnostic: any, idx: number) => (
                      <div key={idx} style={{ marginTop: "0.25rem" }}>
                        • {diagnostic.messageText}
                      </div>
                    ))}
                {event.result.type === "exception" && (
                  <div style={{ marginTop: "0.25rem" }}>
                    • Exception occurred during validation
                  </div>
                )}
              </>
            )}
          </>
        ),
        isError: !isAuthSuccess,
        isSuccess: isAuthSuccess,
        step: event.step,
      };
    case "prismaInsufficient":
      return {
        title: "Prisma Model Generation Insufficient",
        description: (
          <>
            Prisma model generation was incomplete for the assigned component.
            <br />
            <br />
            <strong>Component:</strong> {event.component.namespace}
            <br />
            <strong>Generated Models:</strong> {event.actual.length}
            <br />
            <strong>Missing Models:</strong> {event.missed.length}
            <br />
            <br />
            {event.missed.length > 0 && (
              <>
                <strong>Missed Tables:</strong>
                <br />
                {event.missed.slice(0, 5).map((table: string, idx: number) => (
                  <div key={idx} style={{ marginTop: "0.25rem" }}>
                    • {table}
                  </div>
                ))}
                {event.missed.length > 5 && (
                  <div style={{ marginTop: "0.25rem" }}>
                    ... and {event.missed.length - 5} more
                  </div>
                )}
              </>
            )}
          </>
        ),
        isError: true,
        isSuccess: false,
        step: undefined, // prismaInsufficient doesn't have step
      };
    case "interfaceOperationsReview":
      return {
        title: "Interface Operations Review",
        description: (
          <>
            API operations are being reviewed for quality and consistency.
            <br />
            <br />
            <strong>Operations Count:</strong> {event.operations.length}
            <br />
            <strong>Status:</strong> Review in progress
            <br />
            <br />
            <strong>Review Summary:</strong>
            <br />
            <div
              style={{
                maxHeight: "100px",
                overflow: "hidden",
                fontSize: "0.75rem",
                color: "#64748b",
                marginTop: "0.5rem",
              }}
            >
              {event.review.length > 200
                ? `${event.review.substring(0, 200)}...`
                : event.review}
            </div>
          </>
        ),
        isError: false,
        isSuccess: true,
        step: event.step,
      };
    case "interfaceComplement":
      return {
        title: "Interface Schema Complement",
        description: (
          <>
            Missing schema definitions are being added to complete the API
            specification.
            <br />
            <br />
            <strong>Missing Schemas:</strong> {event.missed.length}
            <br />
            <strong>Added Schemas:</strong> {Object.keys(event.schemas).length}
            <br />
            <br />
            {event.missed.length > 0 && (
              <>
                <strong>Complemented Types:</strong>
                <br />
                {event.missed.slice(0, 5).map((schema: string, idx: number) => (
                  <div key={idx} style={{ marginTop: "0.25rem" }}>
                    • {schema}
                  </div>
                ))}
                {event.missed.length > 5 && (
                  <div style={{ marginTop: "0.25rem" }}>
                    ... and {event.missed.length - 5} more
                  </div>
                )}
              </>
            )}
          </>
        ),
        isError: false,
        isSuccess: true,
        step: event.step,
      };
    default:
      event satisfies never;
      throw new Error("Unknown validation event type");
  }
}
