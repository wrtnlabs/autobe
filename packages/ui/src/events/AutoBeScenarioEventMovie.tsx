import {
  AutoBeAnalyzeScenarioEvent,
  AutoBeInterfaceGroupsEvent,
  AutoBePrismaComponentsEvent,
  AutoBeRealizeTestResetEvent,
} from "@autobe/interface";
import { JSX } from "react";

export interface IAutoBeScenarioEventMovieProps {
  event:
    | AutoBeAnalyzeScenarioEvent
    | AutoBePrismaComponentsEvent
    | AutoBeInterfaceGroupsEvent
    | AutoBeRealizeTestResetEvent;
}
export const AutoBeScenarioEventMovie = (
  props: IAutoBeScenarioEventMovieProps,
) => {
  const { event } = props;
  const { title, description } = getState(event);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  return (
    <div
      style={{
        backgroundColor: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: "0.75rem",
        padding: "1.5rem",
        marginBottom: "1rem",
        boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
      }}
    >
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
          {/* Status Icon */}
          <div
            style={{
              width: "2rem",
              height: "2rem",
              backgroundColor: "#3b82f6",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              style={{ color: "#ffffff" }}
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>

          {/* Title and Step */}
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
          </div>
        </div>

        {/* Timestamp */}
        <div
          style={{
            fontSize: "0.75rem",
            color: "#64748b",
            textAlign: "right",
          }}
        >
          {formatTime(event.created_at)}
        </div>
      </div>

      {/* Description */}
      <div
        style={{
          fontSize: "0.875rem",
          lineHeight: "1.5",
          color: "#475569",
          backgroundColor: "#ffffff",
          padding: "1rem",
          borderRadius: "0.5rem",
          border: "1px solid #e2e8f0",
        }}
      >
        {description}
      </div>
    </div>
  );
};
export default AutoBeScenarioEventMovie;

interface IState {
  title: string;
  description: string | JSX.Element;
}

function getState(event: IAutoBeScenarioEventMovieProps["event"]): IState {
  switch (event.type) {
    case "analyzeScenario":
      return {
        title: "Analyze Scenario",
        description: (
          <>
            Generating analysis report.
            <br />
            <br />
            Number of documents to write: #{event.files.length}
          </>
        ),
      };
    case "prismaComponents":
      return {
        title: "Prisma Components",
        description: (
          <>
            Generating Prisma components.
            <br />
            <br />
            Number of Prisma schemas would be:
            <br />
            <ul>
              <li>namespaces: #{event.components.length}</li>
              <li>
                tables: #
                {event.components
                  .map((c) => c.tables.length)
                  .reduce((a, b) => a + b, 0)}
              </li>
            </ul>
          </>
        ),
      };
    case "interfaceGroups":
      return {
        title: "Interface Endpoint Groups",
        description: (
          <>
            Generating interface endpoint groups.
            <br />
            <br />
            Number of API operation groups would be #{event.groups.length}
          </>
        ),
      };
    case "realizeTestReset":
      return {
        title: "Realize Test Reset",
        description: "Resetting test environment.",
      };
    default:
      event satisfies never;
      throw new Error("Unknown event type");
  }
}
