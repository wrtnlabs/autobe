import {
  AutoBePrismaCorrectEvent,
  AutoBeRealizeAuthorizationCorrectEvent,
  AutoBeRealizeCorrectEvent,
  AutoBeTestCorrectEvent,
} from "@autobe/interface";
import React from "react";

import { EventCard, EventContent, EventHeader } from "./common";

/** Props interface for AutoBeCorrectEventMovie component */
export interface IAutoBeCorrectEventMovieProps {
  /** Correct event to display */
  event:
    | AutoBePrismaCorrectEvent
    | AutoBeTestCorrectEvent
    | AutoBeRealizeCorrectEvent
    | AutoBeRealizeAuthorizationCorrectEvent;
}

/** Event type definition */
type CorrectEventType =
  | "prismaCorrect"
  | "testCorrect"
  | "realizeCorrect"
  | "realizeAuthorizationCorrect";

/** Get step configuration based on event type */
function getStepConfig(eventType: CorrectEventType): {
  title: string;
  description: string;
} {
  switch (eventType) {
    case "prismaCorrect":
      return {
        title: "Prisma Schema Corrected",
        description: "Database schema has been successfully corrected",
      };
    case "testCorrect":
      return {
        title: "Test Code Corrected",
        description: "Test implementation has been successfully corrected",
      };
    case "realizeCorrect":
      return {
        title: "Implementation Corrected",
        description: "API implementation has been successfully corrected",
      };
    case "realizeAuthorizationCorrect":
      return {
        title: "Authorization Corrected",
        description: "Authorization logic has been successfully corrected",
      };
    default:
      eventType satisfies never;
      throw new Error(`Unknown event type: ${eventType}`);
  }
}

/** Get additional details section based on event type */
function getEventDetails(
  event: IAutoBeCorrectEventMovieProps["event"],
): React.ReactElement | null {
  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  };

  const sectionStyle: React.CSSProperties = {
    backgroundColor: "#f0fdf4",
    padding: "1rem",
    borderRadius: "0.5rem",
    border: "1px solid #bbf7d0",
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "0.75rem",
    fontSize: "0.875rem",
    fontWeight: "600",
    color: "#16a34a",
  };

  const infoItemStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.5rem",
    backgroundColor: "#f8fafc",
    borderRadius: "0.25rem",
    fontSize: "0.75rem",
    color: "#475569",
    marginBottom: "0.5rem",
  };

  const labelStyle: React.CSSProperties = {
    fontWeight: "500",
    color: "#64748b",
  };

  const valueStyle: React.CSSProperties = {
    fontFamily: "monospace",
    backgroundColor: "#e2e8f0",
    padding: "0.125rem 0.375rem",
    borderRadius: "0.25rem",
    fontSize: "0.625rem",
  };

  const codeBlockStyle: React.CSSProperties = {
    backgroundColor: "#f1f5f9",
    border: "1px solid #e2e8f0",
    borderRadius: "0.375rem",
    padding: "0.75rem",
    marginTop: "0.5rem",
    fontSize: "0.75rem",
    fontFamily: "monospace",
    color: "#475569",
    maxHeight: "120px",
    overflowY: "auto",
    lineHeight: "1.4",
    whiteSpace: "pre-wrap",
  };

  const badgeStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    padding: "0.25rem 0.5rem",
    backgroundColor: "#dcfce7",
    color: "#16a34a",
    borderRadius: "0.375rem",
    fontSize: "0.75rem",
    fontWeight: "500",
    border: "1px solid #bbf7d0",
  };

  switch (event.type) {
    case "prismaCorrect":
      const prismaEvent = event as IAutoBeCorrectEventMovieProps["event"] & {
        type: "prismaCorrect";
      };
      return (
        <div style={containerStyle}>
          <div style={sectionStyle}>
            <div style={headerStyle}>
              🗄️ <span>Database Schema Corrections</span>
            </div>

            <div style={infoItemStyle}>
              <span style={labelStyle}>Analysis Step:</span>
              <span style={valueStyle}>Step {prismaEvent.step}</span>
            </div>

            {prismaEvent.planning && (
              <div>
                <div style={labelStyle}>🎯 Correction Strategy:</div>
                <div style={codeBlockStyle}>{prismaEvent.planning}</div>
              </div>
            )}

            {prismaEvent.failure && (
              <div>
                <div style={labelStyle}>⚠️ Validation Issues:</div>
                <div style={codeBlockStyle}>
                  {JSON.stringify(prismaEvent.failure, null, 2)}
                </div>
              </div>
            )}

            <div style={{ marginTop: "0.75rem" }}>
              <span style={badgeStyle}>✓ Schema Validated</span>
            </div>
          </div>
        </div>
      );

    case "testCorrect":
      const testEvent = event as IAutoBeCorrectEventMovieProps["event"] & {
        type: "testCorrect";
      };
      return (
        <div style={containerStyle}>
          <div style={sectionStyle}>
            <div style={headerStyle}>
              🧪 <span>Test Suite Corrections</span>
            </div>

            <div style={infoItemStyle}>
              <span style={labelStyle}>Analysis Step:</span>
              <span style={valueStyle}>Step {testEvent.step}</span>
            </div>

            {testEvent.file?.location && (
              <div style={infoItemStyle}>
                <span style={labelStyle}>Test File:</span>
                <span style={valueStyle}>{testEvent.file.location}</span>
              </div>
            )}

            {testEvent.think_without_compile_error && (
              <div>
                <div style={labelStyle}>💭 Initial Analysis:</div>
                <div style={codeBlockStyle}>
                  {testEvent.think_without_compile_error}
                </div>
              </div>
            )}

            {testEvent.think_again_with_compile_error && (
              <div>
                <div style={labelStyle}>🔄 Revised Analysis:</div>
                <div style={codeBlockStyle}>
                  {testEvent.think_again_with_compile_error}
                </div>
              </div>
            )}

            {testEvent.review && (
              <div>
                <div style={labelStyle}>📋 Review Results:</div>
                <div style={codeBlockStyle}>{testEvent.review}</div>
              </div>
            )}

            <div style={{ marginTop: "0.75rem" }}>
              <span style={badgeStyle}>✓ Tests Corrected</span>
            </div>
          </div>
        </div>
      );

    case "realizeCorrect":
      const realizeEvent = event as IAutoBeCorrectEventMovieProps["event"] & {
        type: "realizeCorrect";
      };
      return (
        <div style={containerStyle}>
          <div style={sectionStyle}>
            <div style={headerStyle}>
              ⚙️ <span>Implementation Corrections</span>
            </div>

            <div style={infoItemStyle}>
              <span style={labelStyle}>Analysis Step:</span>
              <span style={valueStyle}>Step {realizeEvent.step}</span>
            </div>

            <div style={infoItemStyle}>
              <span style={labelStyle}>File Location:</span>
              <span style={valueStyle}>{realizeEvent.location}</span>
            </div>

            {realizeEvent.content && (
              <div>
                <div style={labelStyle}>📄 Corrected Implementation:</div>
                <div style={codeBlockStyle}>
                  {realizeEvent.content.slice(0, 500)}
                  {realizeEvent.content.length > 500 && "..."}
                </div>
              </div>
            )}

            <div style={{ marginTop: "0.75rem" }}>
              <span style={badgeStyle}>✓ Implementation Fixed</span>
            </div>
          </div>
        </div>
      );

    case "realizeAuthorizationCorrect":
      const authEvent = event as IAutoBeCorrectEventMovieProps["event"] & {
        type: "realizeAuthorizationCorrect";
      };
      return (
        <div style={containerStyle}>
          <div style={sectionStyle}>
            <div style={headerStyle}>
              🔐 <span>Authorization Corrections</span>
            </div>

            <div style={infoItemStyle}>
              <span style={labelStyle}>Analysis Step:</span>
              <span style={valueStyle}>Step {authEvent.step}</span>
            </div>

            {authEvent.authorization && (
              <div style={infoItemStyle}>
                <span style={labelStyle}>Authorization Module:</span>
                <span style={valueStyle}>
                  {JSON.stringify(authEvent.authorization).slice(0, 50)}...
                </span>
              </div>
            )}

            {authEvent.result && (
              <div>
                <div style={labelStyle}>⚠️ Compilation Issues:</div>
                <div style={codeBlockStyle}>
                  {JSON.stringify(authEvent.result, null, 2)}
                </div>
              </div>
            )}

            <div style={{ marginTop: "0.75rem" }}>
              <span style={badgeStyle}>✓ Authorization Secured</span>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}

/** Component for displaying correction events */
export const AutoBeCorrectEventMovie = (
  props: IAutoBeCorrectEventMovieProps,
) => {
  const eventType = props.event.type;
  const config = getStepConfig(eventType);
  const eventDetails = getEventDetails(props.event);

  return (
    <EventCard variant="success">
      <EventHeader
        title={config.title}
        subtitle={config.description}
        timestamp={props.event.created_at}
        iconType="success"
      />
      <EventContent>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span
              style={{
                color: "#16a34a",
                fontWeight: "600",
                fontSize: "0.875rem",
              }}
            >
              ✓ Correction Applied
            </span>
          </div>

          <div
            style={{
              fontSize: "0.875rem",
              color: "#475569",
              lineHeight: "1.5",
            }}
          >
            The system has automatically detected and corrected issues in the
            code. The corrected version is now ready for the next step.
          </div>

          {/* Additional details based on event type */}
          {eventDetails}
        </div>
      </EventContent>
    </EventCard>
  );
};

export default AutoBeCorrectEventMovie;
