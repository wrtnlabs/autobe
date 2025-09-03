import { IAutoBeTokenUsageJson } from "@autobe/interface";
import React from "react";

import { useAutoBeAgent } from "../context/AutoBeAgentContext";
import { useEscapeKey } from "../hooks";
import { AutoBeListenerState } from "../structure";
import { toCompactNumberFormat } from "../utils";

// Types
interface IAutoBeStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Style constants
const MODAL_STYLES = {
  overlay: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.6)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1001,
    padding: "1rem",
  },
  container: {
    background: "#ffffff",
    borderRadius: "16px",
    boxShadow:
      "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)",
    maxWidth: "700px",
    maxHeight: "85vh",
    width: "100%",
    overflowY: "auto" as const,
    position: "relative" as const,
  },
  closeButton: {
    position: "absolute" as const,
    top: "1rem",
    right: "1rem",
    background: "rgba(107, 114, 128, 0.1)",
    border: "none",
    borderRadius: "50%",
    width: "2rem",
    height: "2rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#6b7280",
    fontSize: "1.2rem",
    zIndex: 10,
  },
  content: {
    padding: "1.25rem",
  },
  section: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "1.5rem",
  },
} as const;

const CARD_STYLES = {
  base: {
    background: "linear-gradient(145deg, #ffffff, #f8fafc)",
    borderRadius: "8px",
    padding: "0.7rem",
    marginBottom: "0.4rem",
    border: "1px solid rgba(148, 163, 184, 0.15)",
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
  },
  header: {
    margin: "0 0 0.5rem 0",
    fontSize: "0.8rem",
    fontWeight: "700",
    color: "#374151",
    textTransform: "capitalize" as const,
    letterSpacing: "0.025em",
  },
  sectionTitle: {
    margin: 0,
    color: "#1e293b",
    fontSize: "0.9rem",
    fontWeight: "600",
    letterSpacing: "-0.01em",
  },
} as const;

const PROGRESS_STYLES = {
  card: {
    borderRadius: "10px",
    padding: "0.75rem",
    position: "relative" as const,
    overflow: "hidden",
  },
  completed: {
    background: "linear-gradient(135deg, #10b981, #059669)",
    border: "1px solid rgba(16, 185, 129, 0.2)",
    color: "white",
    boxShadow: "0 2px 8px rgba(16, 185, 129, 0.25)",
  },
  pending: {
    background: "linear-gradient(145deg, #ffffff, #f8fafc)",
    border: "1px solid rgba(148, 163, 184, 0.15)",
    color: "#6b7280",
    boxShadow: "0 2px 4px -1px rgba(0, 0, 0, 0.05)",
  },
} as const;

// Step configuration
const PROGRESS_STEPS = [
  {
    name: "analyze",
    title: "Requirements Analysis",
    getResults: (state: AutoBeListenerState) => {
      if (!state.analyze) return null;
      const fileCount = Object.keys(state.analyze.files).length;
      const roleCount = state.analyze.roles.length;
      return `${fileCount} analysis files, ${roleCount} user roles`;
    },
  },
  {
    name: "prisma",
    title: "Database Design",
    getResults: (state: AutoBeListenerState) => {
      if (!state.prisma) return null;
      const schemaCount = Object.keys(state.prisma.schemas).length;
      return `${schemaCount} schema files`;
    },
  },
  {
    name: "interface",
    title: "API Interface",
    getResults: (state: AutoBeListenerState) => {
      if (!state.interface) return null;
      const operationCount = state.interface.document.operations.length;
      const authCount = state.interface.authorizations.length;
      return `${operationCount} API endpoints, ${authCount} auth`;
    },
  },
  {
    name: "test",
    title: "Test Code",
    getResults: (state: AutoBeListenerState) => {
      if (!state.test) return null;
      const testCount = state.test.files.length;
      return `${testCount} test files`;
    },
  },
  {
    name: "realize",
    title: "Implementation Complete",
    getResults: (state: AutoBeListenerState) => {
      if (!state.realize) return null;
      const functionCount = state.realize.functions.length;
      const authCount = state.realize.authorizations.length;
      return `${functionCount} implementation functions, ${authCount} auth decorators`;
    },
  },
] as const;

// Helper components
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div style={{ marginBottom: "1rem" }}>
    <h3 style={CARD_STYLES.sectionTitle}>{children}</h3>
  </div>
);

const ConnectionInfo = ({ header }: { header: any }) => (
  <div>
    <SectionTitle>Connection Info</SectionTitle>
    <div
      style={{
        background: "linear-gradient(145deg, #ffffff, #f8fafc)",
        borderRadius: "10px",
        padding: "1rem",
        border: "1px solid rgba(148, 163, 184, 0.15)",
        boxShadow: "0 2px 4px -1px rgba(0, 0, 0, 0.05)",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: "0.8rem",
          color: "#374151",
          lineHeight: 1.5,
        }}
      >
        <strong>Model:</strong> {header?.model || "N/A"} |{" "}
        <strong>Vendor:</strong> {header?.vendor?.name || "N/A"} |{" "}
        <strong>Locale:</strong> {header?.locale || "N/A"} |{" "}
        <strong>Timezone:</strong> {header?.timezone || "N/A"}
      </p>
    </div>
  </div>
);

const HighlightNumbers = ({
  text,
  isCompleted,
}: {
  text: string;
  isCompleted: boolean;
}) => {
  const parts = text.split(/(\d+)/);
  return (
    <>
      {parts.map((part, index) => {
        const isNumber = /^\d+$/.test(part);
        if (isNumber) {
          return (
            <span
              key={index}
              style={{
                fontWeight: "700",
                fontSize: "0.8rem",
                color: isCompleted ? "#ffffff" : "#3b82f6",
              }}
            >
              {part}
            </span>
          );
        }
        return part;
      })}
    </>
  );
};

const ProgressCard = ({
  step,
  isCompleted,
  results,
}: {
  step: (typeof PROGRESS_STEPS)[number];
  isCompleted: boolean;
  results: string | null;
}) => (
  <div
    style={{
      ...PROGRESS_STYLES.card,
      ...(isCompleted ? PROGRESS_STYLES.completed : PROGRESS_STYLES.pending),
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", flexDirection: "row", gap: "0.2rem" }}>
          <span
            style={{
              fontSize: "0.85rem",
              fontWeight: "700",
              marginBottom: "0.2rem",
              textTransform: "uppercase",
              letterSpacing: "0.02em",
            }}
          >
            {step.name}
          </span>
          <span
            style={{
              fontSize: "0.75rem",
              opacity: 0.9,
              marginBottom: "0.2rem",
            }}
          >
            ({step.title})
          </span>
        </div>

        {results && (
          <div
            style={{
              fontSize: "0.7rem",
              opacity: 0.8,
              fontWeight: "500",
            }}
          >
            <HighlightNumbers text={results} isCompleted={isCompleted} />
          </div>
        )}
      </div>
      <div
        style={{
          fontSize: "0.7rem",
          fontWeight: "600",
          padding: "0.3rem 0.6rem",
          borderRadius: "10px",
          background: isCompleted
            ? "rgba(255, 255, 255, 0.2)"
            : "rgba(107, 114, 128, 0.1)",
        }}
      >
        {isCompleted ? "Completed" : "Pending"}
      </div>
    </div>
  </div>
);

const ProgressStatus = ({ state }: { state: AutoBeListenerState }) => (
  <div>
    <SectionTitle>Progress Status</SectionTitle>
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
      }}
    >
      {PROGRESS_STEPS.map((step) => (
        <ProgressCard
          key={step.name}
          step={step}
          isCompleted={state[step.name as keyof AutoBeListenerState] !== null}
          results={step.getResults(state)}
        />
      ))}
    </div>
  </div>
);

const TokenRow = ({
  label,
  value,
  subInfo,
}: {
  label: string;
  value: number;
  subInfo?: { label: string; value: number };
}) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}
  >
    <div style={{ display: "flex", flexDirection: "column" }}>
      <span
        style={{
          fontSize: "0.7rem",
          fontWeight: "600",
          color: "#6b7280",
        }}
      >
        {label}
      </span>
      {subInfo && (
        <span
          style={{
            fontSize: "0.6rem",
            color: "#9ca3af",
            fontWeight: "500",
          }}
        >
          {subInfo.label}: {toCompactNumberFormat(subInfo.value)}
        </span>
      )}
    </div>
    <span
      style={{
        fontSize: "0.75rem",
        fontWeight: "700",
        color: "#1f2937",
      }}
    >
      {toCompactNumberFormat(value)}
    </span>
  </div>
);

const ComponentStats = ({
  name,
  component,
}: {
  name: string;
  component: IAutoBeTokenUsageJson.IComponent;
}) => (
  <div style={CARD_STYLES.base}>
    <h4 style={CARD_STYLES.header}>{name}</h4>
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.4rem",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.2rem",
        }}
      >
        <TokenRow label="Total" value={component.total} />
        <TokenRow
          label="Input"
          value={component.input.total}
          subInfo={
            component.input.cached > 0
              ? { label: "Cache", value: component.input.cached }
              : undefined
          }
        />
        <TokenRow label="Output" value={component.output.total} />
      </div>
    </div>
  </div>
);

const TokenUsage = ({
  tokenUsage,
}: {
  tokenUsage: IAutoBeTokenUsageJson | null;
}) => {
  if (!tokenUsage) {
    return (
      <div
        style={{
          padding: "2rem",
          textAlign: "center",
          color: "#6b7280",
          fontSize: "0.9rem",
        }}
      >
        Unable to load token usage information
      </div>
    );
  }

  return (
    <div>
      <SectionTitle>Token Usage - Total</SectionTitle>
      <ComponentStats name="total" component={tokenUsage.aggregate} />
    </div>
  );
};

export const AutoBeStatusModal = ({
  isOpen,
  onClose,
}: IAutoBeStatusModalProps) => {
  const { tokenUsage, state, header } = useAutoBeAgent();

  useEscapeKey(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div style={MODAL_STYLES.overlay} onClick={onClose}>
      <div style={MODAL_STYLES.container} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} style={MODAL_STYLES.closeButton}>
          ×
        </button>

        <div style={MODAL_STYLES.content}>
          <div style={MODAL_STYLES.section}>
            <ConnectionInfo header={header} />
            <ProgressStatus state={state} />
            <TokenUsage tokenUsage={tokenUsage} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoBeStatusModal;
