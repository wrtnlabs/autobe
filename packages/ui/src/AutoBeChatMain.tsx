import { AutoBeUserMessageContent } from "@autobe/interface";
import { RefObject, useEffect, useRef, useState } from "react";

import { AutoBeChatUploadBox, AutoBeEventMovie, IAutoBeUploadConfig } from ".";
import AutoBeStatusModal from "./components/AutoBeStatusModal";
import { useAutoBeAgent } from "./context/AutoBeAgentContext";
import { useMediaQuery } from "./hooks";

export interface IAutoBeChatMainProps {
  isMobile: boolean;
  conversate: (messages: AutoBeUserMessageContent[]) => Promise<void>;
  setError: (error: Error) => void;
  uploadConfig?: IAutoBeUploadConfig;
  className?: string;
  style?: React.CSSProperties;
}

export const AutoBeChatMain = (props: IAutoBeChatMainProps) => {
  const bodyContainerRef = useRef<HTMLDivElement>(null);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  const { eventGroups } = useAutoBeAgent();
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);

  const listener: RefObject<AutoBeChatUploadBox.IListener> = useRef({
    handleDragEnter: () => {},
    handleDragLeave: () => {},
    handleDrop: () => {},
    handleDragOver: () => {},
  });

  useEffect(() => {
    if (eventGroups.length === 0) return;
    scrollAnchorRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [bodyContainerRef.current?.scrollHeight]);

  return (
    <div
      onDragEnter={(e) => listener.current.handleDragEnter(e)}
      onDragLeave={(e) => listener.current.handleDragLeave(e)}
      onDragOver={(e) => listener.current.handleDragOver(e)}
      onDrop={(e) => listener.current.handleDrop(e)}
      style={{
        position: "relative",
        overflowY: "auto",
        margin: 0,
        flexGrow: 1,
        display: "flex",
        flexDirection: "column",
        ...props.style,
      }}
      className={props.className}
      ref={bodyContainerRef}
    >
      {/* Token Usage Button - Sticky position in top right */}
      <div
        style={{
          position: "sticky",
          top: "1rem",
          zIndex: 1001,
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "-3rem",
          paddingRight: "1.5rem",
        }}
      >
        <button
          onClick={() => setIsTokenModalOpen(!isTokenModalOpen)}
          style={{
            background: "#f8f9fa",
            color: "#495057",
            border: "1px solid #dee2e6",
            borderRadius: "50%",
            padding: "0.5rem",
            width: "2rem",
            height: "2rem",
            cursor: "pointer",
            fontSize: "0.85rem",
            fontWeight: "400",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.15)";
            e.currentTarget.style.background = "#e9ecef";
            e.currentTarget.style.borderColor = "#adb5bd";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
            e.currentTarget.style.background = "#f8f9fa";
            e.currentTarget.style.borderColor = "#dee2e6";
          }}
          title="View System Status"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        </button>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          maxWidth: useMediaQuery.WIDTH_MD,
          width: "100%",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            padding: "2rem",
            gap: 16,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {eventGroups.map((e, index) => (
            <AutoBeEventMovie
              key={index}
              events={e.events}
              last={index === eventGroups.length - 1}
            />
          ))}
        </div>
      </div>

      {/*
       * Prompt input area
       * this flexGrow: 1 means that the prompt input area will take up the remaining space
       * so that the upload box will be at the bottom of the screen
       */}
      <div
        style={{ flexGrow: 1, minHeight: "1rem" }}
        ref={scrollAnchorRef}
      ></div>
      <div
        style={{
          position: "sticky",
          bottom: 16,
          left: 0,
          right: 0,
          zIndex: 1000,
        }}
      >
        <AutoBeChatUploadBox
          listener={listener}
          uploadConfig={props.uploadConfig}
          conversate={props.conversate}
          setError={props.setError}
        />
      </div>

      {/* System Status Modal */}
      <AutoBeStatusModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
      />
    </div>
  );
};
export default AutoBeChatMain;
