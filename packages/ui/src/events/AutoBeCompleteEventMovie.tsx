import {
  AutoBeAnalyzeCompleteEvent,
  AutoBeInterfaceCompleteEvent,
  AutoBePrismaCompleteEvent,
  AutoBeRealizeCompleteEvent,
  AutoBeTestCompleteEvent,
  IAutoBeGetFilesOptions,
} from "@autobe/interface";
import { useState } from "react";

import { EventCard, EventContent, EventHeader } from "./common";

export interface IAutoBeCompleteEventMovieProps {
  getFiles: (
    options?: Partial<IAutoBeGetFilesOptions>,
  ) => Promise<Record<string, string>>;
  event:
    | AutoBeAnalyzeCompleteEvent
    | AutoBePrismaCompleteEvent
    | AutoBeInterfaceCompleteEvent
    | AutoBeTestCompleteEvent
    | AutoBeRealizeCompleteEvent;
}

export const AutoBeCompleteEventMovie = (
  props: IAutoBeCompleteEventMovieProps,
) => {
  const stage = getStage(props.event);
  const [size, setSize] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);

  const getFiles = async (dbms: "postgres" | "sqlite") => {
    setDownloading(true);
    try {
      const result = await props.getFiles({
        dbms,
        stage,
      });
      return result;
    } catch (error) {
      throw error;
    } finally {
      setDownloading(false);
    }
  };

  const openStackBlitz = async () => {
    const files: Record<string, string> = Object.fromEntries(
      Object.entries(await getFiles("sqlite")).filter(
        ([key, value]) =>
          key.startsWith("autobe/") === false &&
          new TextEncoder().encode(value).length < 512 * 1024, // 512 KB
      ),
    );
    const size: number = Object.values(files)
      .map((str) => new TextEncoder().encode(str).length)
      .reduce((a, b) => a + b, 0);
    setSize(size);

    // StackBlitz SDK 사용 (실제 구현 시 필요)
    // StackBlitzSDK.openProject(...);
    console.log("Opening StackBlitz with files:", Object.keys(files).length);
  };

  const download = async (dbms: "postgres" | "sqlite") => {
    const files = await getFiles(dbms);

    // 간단한 다운로드 구현 (JSZip 없이)
    const data = JSON.stringify(files, null, 2);
    const blob = new Blob([data], { type: "application/json" });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `AutoBE.${props.event.type}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const title: string | null = getTitle(props.event);
  if (title === null) return null;

  return (
    <EventCard variant="success">
      <EventHeader
        title={`${title} Completed`}
        timestamp={props.event.created_at}
        iconType="success"
      />
      <EventContent>
        <div style={{ marginBottom: "1rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "6px 12px",
              border: "1px solid #4caf50",
              borderRadius: "16px",
              backgroundColor: "transparent",
              color: "#4caf50",
              fontSize: "14px",
              fontWeight: 500,
              gap: "6px",
              marginBottom: "1rem",
            }}
          >
            ✅ {title} Completed
          </div>
          <br />
          <br />
          {title} has been completed.
          {getMessage(openStackBlitz, props.event)}
          <br />
          <br />
          Please check the result in the file explorer.
          {size !== null && size >= LIMIT && (
            <div
              style={{
                backgroundColor: "#fffbeb",
                border: "1px solid #fed7aa",
                borderRadius: "0.5rem",
                padding: "1rem",
                marginTop: "1rem",
                color: "#92400e",
              }}
            >
              <strong>⚠️ Warning:</strong> This project is too large (
              {(size / 1024 / 1024).toFixed(1)} MB) for StackBlitz.
              <br />
              <br />
              Try downloading it directly instead!
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            justifyContent: "flex-end",
            flexWrap: "wrap",
          }}
        >
          {downloading ? (
            <button
              disabled
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1rem",
                backgroundColor: "#f3f4f6",
                border: "1px solid #d1d5db",
                borderRadius: "0.5rem",
                cursor: "not-allowed",
                fontSize: "0.875rem",
                color: "#6b7280",
              }}
            >
              ⏳ Downloading Source Codes...
            </button>
          ) : props.event.type === "analyzeComplete" ? (
            <>
              <ActionButton
                icon="📥"
                text="Zip (SQLite)"
                onClick={() => download("sqlite")}
                title={
                  stage !== "analyze"
                    ? "Download SQLite-based backend application (ideal for local development and testing)"
                    : "Download requirement analysis report"
                }
              />
              <ActionButton
                icon="🚀"
                text="StackBlitz"
                onClick={() => openStackBlitz()}
                variant={size !== null && size >= LIMIT ? "warning" : "primary"}
                title="Open project in StackBlitz for instant online development and testing"
              />
            </>
          ) : (
            <>
              <ActionButton
                icon="☁️"
                text="Zip (Postgres)"
                onClick={() => download("postgres")}
                title="Download PostgreSQL-based backend application (optimized for production deployment)"
              />
              <ActionButton
                icon="📥"
                text="Zip (SQLite)"
                onClick={() => download("sqlite")}
                title="Download SQLite-based backend application (ideal for local development and testing)"
              />
              <ActionButton
                icon="🚀"
                text="StackBlitz"
                onClick={() => openStackBlitz()}
                variant={size !== null && size >= LIMIT ? "warning" : "primary"}
                title="Open project in StackBlitz for instant online development and testing"
              />
            </>
          )}
        </div>
      </EventContent>
    </EventCard>
  );
};

interface IActionButtonProps {
  icon: string;
  text: string;
  onClick: () => void;
  title?: string;
  variant?: "primary" | "warning";
}

const ActionButton = (props: IActionButtonProps) => {
  const { icon, text, onClick, title, variant = "primary" } = props;

  const getButtonStyles = () => {
    const baseStyles = {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0.75rem 1rem",
      borderRadius: "0.5rem",
      cursor: "pointer",
      fontSize: "0.875rem",
      fontWeight: 500,
      border: "1px solid",
      transition: "all 0.2s ease",
    };

    if (variant === "warning") {
      return {
        ...baseStyles,
        backgroundColor: "#fffbeb",
        borderColor: "#f59e0b",
        color: "#92400e",
      };
    }

    return {
      ...baseStyles,
      backgroundColor: "#3b82f6",
      borderColor: "#3b82f6",
      color: "#ffffff",
    };
  };

  return (
    <button
      onClick={onClick}
      title={title}
      style={getButtonStyles()}
      onMouseEnter={(e) => {
        if (variant === "warning") {
          e.currentTarget.style.backgroundColor = "#fef3c7";
        } else {
          e.currentTarget.style.backgroundColor = "#2563eb";
        }
      }}
      onMouseLeave={(e) => {
        if (variant === "warning") {
          e.currentTarget.style.backgroundColor = "#fffbeb";
        } else {
          e.currentTarget.style.backgroundColor = "#3b82f6";
        }
      }}
    >
      <span>{icon}</span>
      <span>{text}</span>
    </button>
  );
};

// Helper functions

function getTitle(
  event: IAutoBeCompleteEventMovieProps["event"],
): string | null {
  switch (event.type) {
    case "analyzeComplete":
      return "Analyze";
    case "prismaComplete":
      if (event.compiled.type !== "success") return "Prisma (Error)";
      return "Prisma";
    case "interfaceComplete":
      return "Interface";
    case "testComplete":
      return "Test";
    case "realizeComplete":
      return "Realize";
    default:
      event satisfies never;
      throw new Error("Unknown event type");
  }
}

const getMessage = (
  openStackBlitz: () => void,
  event: IAutoBeCompleteEventMovieProps["event"],
) => {
  if (event.type === "prismaComplete" && event.compiled.type === "failure")
    return (
      <>
        <br />
        <br />
        Succeeded to compose <code>AutoBePrisma.IApplication</code> typed AST
        (Abstract Syntax Tree) data, but failed to generate Prisma schema files
        from it. This is a bug of <code>@autobe</code>. Please{" "}
        <a
          href="https://github.com/wrtnlabs/autobe/issues"
          target="_blank"
          style={{ color: "#3b82f6", textDecoration: "underline" }}
        >
          write a bug report to our repository
        </a>{" "}
        with the{" "}
        <a
          href="#"
          onClick={() => openStackBlitz()}
          style={{ color: "#3b82f6", textDecoration: "underline" }}
        >
          <code>autobe/histories.json</code>
        </a>{" "}
        file.
      </>
    );
  else if (
    (event.type === "testComplete" || event.type === "realizeComplete") &&
    event.compiled.type !== "success"
  )
    return (
      <>
        <br />
        <br />
        Succeeded to compose{" "}
        {event.type === "testComplete" ? "test functions" : "realize functions"}
        , but failed to pass the TypeScript compilation. This is a bug of{" "}
        <code>@autobe</code>. Please{" "}
        <a
          href="https://github.com/wrtnlabs/autobe/issues"
          target="_blank"
          style={{ color: "#3b82f6", textDecoration: "underline" }}
        >
          write a bug report to our repository
        </a>{" "}
        with the{" "}
        <a
          href="#"
          onClick={() => openStackBlitz()}
          style={{ color: "#3b82f6", textDecoration: "underline" }}
        >
          <code>autobe/histories.json</code>
        </a>{" "}
        file.
      </>
    );
  return null;
};

const getStage = (event: IAutoBeCompleteEventMovieProps["event"]) => {
  if (event.type === "analyzeComplete") return "analyze";
  else if (event.type === "prismaComplete") return "prisma";
  else if (event.type === "interfaceComplete") return "interface";
  else if (event.type === "testComplete") return "test";
  else if (event.type === "realizeComplete") return "realize";
  else {
    event satisfies never;
    return undefined;
  }
};

const LIMIT = 3 * 1024 * 1024;

export default AutoBeCompleteEventMovie;
