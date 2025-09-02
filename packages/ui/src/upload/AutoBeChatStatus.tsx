import {
  AutoBeAnalyzeCompleteEvent,
  AutoBeInterfaceCompleteEvent,
  AutoBePrismaCompleteEvent,
  AutoBeRealizeCompleteEvent,
  AutoBeTestCompleteEvent,
} from "@autobe/interface";
import { useState } from "react";

import { useAutoBeAgent } from "../context/AutoBeAgentContext";
import { toCompactNumberFormat } from "../utils";

// Tooltip styles
const tooltipStyles = {
  container: {
    position: "absolute" as const,
    bottom: "100%",
    left: "50%",
    transform: "translateX(-50%)",
    marginBottom: "4px",
    padding: "8px 10px",
    backgroundColor: "#2d3748",
    color: "white",
    fontSize: "0.75rem",
    borderRadius: "6px",
    whiteSpace: "pre-line" as const,
    zIndex: 1000,
    boxShadow: "0px 4px 12px rgba(0,0,0,0.15)",
    minWidth: "140px",
    textAlign: "left" as const,
    lineHeight: "1.4",
  },
  arrow: {
    position: "absolute" as const,
    top: "100%",
    left: "50%",
    transform: "translateX(-50%)",
    width: 0,
    height: 0,
    borderLeft: "5px solid transparent",
    borderRight: "5px solid transparent",
    borderTop: "5px solid #2d3748",
  },
} as const;

const TokenItem = ({
  label,
  value,
  tooltip,
}: {
  label: string;
  value: number;
  tooltip: string;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <span
      style={{
        position: "relative",
        cursor: "help",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <strong>{label}:</strong> {toCompactNumberFormat(value)}
      {isHovered && (
        <div style={tooltipStyles.container}>
          {tooltip}
          <div style={tooltipStyles.arrow} />
        </div>
      )}
    </span>
  );
};

const StatusItem = ({
  completed,
  label,
  eventData,
}: {
  completed: boolean;
  label: string;
  eventData?:
    | AutoBeAnalyzeCompleteEvent
    | AutoBePrismaCompleteEvent
    | AutoBeInterfaceCompleteEvent
    | AutoBeTestCompleteEvent
    | AutoBeRealizeCompleteEvent
    | null;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const formatElapsedTime = (elapsed: number) => {
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getTooltipContent = () => {
    if (!completed) {
      return `${label}\nNot completed yet`;
    }

    const lines = [`${label} Completed`];

    // Add elapsed time first (most important)
    if (eventData?.elapsed) {
      lines.push(`Duration: ${formatElapsedTime(eventData.elapsed)}`);
    }

    // Add specific metrics based on the event type
    if (eventData) {
      switch (eventData.type) {
        case "analyzeComplete":
          lines.push(`Documents: ${eventData.files.length}`);
          lines.push(`User roles: ${eventData.roles.length}`);
          break;
        case "prismaComplete":
          const modelCount = eventData.result.data.files
            .map((f: { models: unknown[] }) => f.models.length)
            .reduce((a: number, b: number) => a + b, 0);
          lines.push(`Namespaces: ${eventData.result.data.files.length}`);
          lines.push(`Models: ${modelCount}`);
          break;
        case "interfaceComplete":
          lines.push(`Operations: ${eventData.document.operations.length}`);
          lines.push(
            `Schemas: ${Object.keys(eventData.document.components.schemas).length}`,
          );
          break;
        case "testComplete":
          lines.push(`Test functions: ${eventData.files.length}`);
          break;
        case "realizeComplete":
          lines.push(
            `Controllers: ${Object.keys(eventData.controllers).length}`,
          );
          lines.push(`Functions: ${eventData.functions.length}`);
          break;
      }
    }

    return lines.join("\n");
  };

  return (
    <span
      style={{
        position: "relative",
        color: completed ? "#198754" : "#6c757d",
        fontWeight: "600",
        cursor: "help",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {completed ? "✓" : "○"} {label}
      {isHovered && (
        <div style={tooltipStyles.container}>
          {getTooltipContent()}
          <div style={tooltipStyles.arrow} />
        </div>
      )}
    </span>
  );
};

export const AutoBeChatStatus = () => {
  const { tokenUsage, state } = useAutoBeAgent();

  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      {/* Token Usage Display */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          fontSize: "0.75rem",
          color: "#6c757d",
          marginBottom: "6px",
          flexWrap: "wrap",
          gap: "4px",
        }}
      >
        <TokenItem
          label="Token Total"
          value={tokenUsage?.aggregate.total || 0}
          tooltip={`Total: ${(tokenUsage?.aggregate.total || 0).toLocaleString()} tokens`}
        />
        <span>•</span>
        <TokenItem
          label="In"
          value={tokenUsage?.aggregate.input.total || 0}
          tooltip={`Input: ${(tokenUsage?.aggregate.input.total || 0).toLocaleString()} tokens`}
        />
        <span>•</span>
        <TokenItem
          label="Cached"
          value={tokenUsage?.aggregate.input.cached || 0}
          tooltip={`Cached: ${(tokenUsage?.aggregate.input.cached || 0).toLocaleString()} tokens`}
        />
        <span>•</span>
        <TokenItem
          label="Out"
          value={tokenUsage?.aggregate.output.total || 0}
          tooltip={`Output: ${(tokenUsage?.aggregate.output.total || 0).toLocaleString()} tokens`}
        />
      </div>

      {/* State Display */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          fontSize: "0.75rem",
          color: "#6c757d",
          marginBottom: "6px",
          gap: "4px",
          flexWrap: "wrap",
        }}
      >
        <StatusItem
          completed={!!state.analyze}
          label="Analyze"
          eventData={state.analyze}
        />
        <StatusItem
          completed={!!state.prisma}
          label="Prisma"
          eventData={state.prisma}
        />
        <StatusItem
          completed={!!state.interface}
          label="Interface"
          eventData={state.interface}
        />
        <StatusItem
          completed={!!state.test}
          label="Test"
          eventData={state.test}
        />
        <StatusItem
          completed={!!state.realize}
          label="Realize"
          eventData={state.realize}
        />
      </div>
    </div>
  );
};

export default AutoBeChatStatus;
