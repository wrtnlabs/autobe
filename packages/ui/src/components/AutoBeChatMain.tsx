import { AutoBeUserMessageContent } from "@autobe/interface";
import { OverlayProvider, overlay } from "overlay-kit";
import { RefObject, useEffect, useRef } from "react";

import { AutoBeChatUploadBox, useAutoBeAgentSessionList } from "..";
import { useAutoBeAgent } from "../context/AutoBeAgentContext";
import { useMediaQuery } from "../hooks";
import {
  DEFAULT_CONFIG,
  IAutoBeConfig,
  IAutoBePartialConfig,
} from "../types/config";
import { getEncryptedSessionStorage } from "../utils/storage";
import AutoBeConfigButton from "./AutoBeConfigButton";
import AutoBeConfigModal, { IConfigField } from "./AutoBeConfigModal";
import AutoBeStatusButton from "./AutoBeStatusButton";
import AutoBeEventGroupMovie from "./events/AutoBeEventGroupMovie";

export interface IAutoBeChatMainProps {
  isUnusedConfig?: boolean;
  isReplay?: boolean;
  isMobile: boolean;
  setError: (error: Error) => void;
  className?: string;
  style?: React.CSSProperties;
  configFields?: IConfigField[];

  /** Additional required config fields beyond openApiKey */
  requiredFields?: string[];
}

export const AutoBeChatMain = (props: IAutoBeChatMainProps) => {
  const bodyContainerRef = useRef<HTMLDivElement>(null);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  const { eventGroups, getAutoBeService, connectionStatus } = useAutoBeAgent();
  const { refreshSessionList } = useAutoBeAgentSessionList();
  const listener: RefObject<AutoBeChatUploadBox.IListener> = useRef({
    handleDragEnter: () => {},
    handleDragLeave: () => {},
    handleDrop: () => {},
    handleDragOver: () => {},
  });

  // Simplified config reader
  const getCurrentConfig = (): IAutoBeConfig => {
    const config: IAutoBePartialConfig = {};

    props.configFields?.forEach((field) => {
      const value = field.encrypted
        ? getEncryptedSessionStorage(field.storageKey)
        : localStorage.getItem(field.storageKey) || "";

      if (field.type === "checkbox") {
        config[field.key] = String(value) === "true";
      } else if (field.type === "number") {
        config[field.key] = parseInt(String(value)) || 0;
      } else {
        config[field.key] = String(value);
      }
    });

    return { ...DEFAULT_CONFIG, ...config };
  };

  // Check if required config is available
  const hasRequiredConfig = (): boolean => {
    const config = getCurrentConfig();

    // Check additional required fields from props
    if (props.requiredFields) {
      for (const field of props.requiredFields) {
        if (!config[field]) return false;
      }
    }

    return true;
  };

  // Unified service connection handler
  const conversate = async (
    messages: AutoBeUserMessageContent[],
  ): Promise<void> => {
    // Check if we have required config
    if (props.isUnusedConfig === false && !hasRequiredConfig()) {
      overlay.open(({ isOpen, close }) => (
        <AutoBeConfigModal
          isOpen={isOpen}
          onClose={close}
          title="Server Connection Required"
          fields={props.configFields || []}
          onSave={() => {
            conversate(messages);
          }}
        />
      ));
    }

    // Connect to service
    try {
      const config = getCurrentConfig();
      const serviceData = await getAutoBeService(config);
      if (messages.length !== 0) {
        await serviceData.service.conversate(messages);
      }
      if (eventGroups.length === 0) {
        refreshSessionList();
      }
    } catch (error) {
      console.error("Failed to connect:", error);
      props.setError(error as Error);
    }
  };

  // Auto-scroll when new events arrive
  useEffect(() => {
    if (eventGroups.length > 0) {
      scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [eventGroups.length]);

  // Auto-connect if there are existing conversations and config is ready
  useEffect(() => {
    if (props.isReplay === true) {
      conversate([]);
      return;
    }

    if (
      eventGroups.length > 0 &&
      hasRequiredConfig() &&
      connectionStatus === "disconnected"
    ) {
      conversate([]);
      return;
    }
  }, [connectionStatus, eventGroups.length]);

  return (
    <OverlayProvider>
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
        {/* Control Buttons & Status - Sticky position in top right */}
        <div
          style={{
            position: "sticky",
            top: "1rem",
            zIndex: 1001,
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "-3rem",
            paddingRight: "1.5rem",
          }}
        >
          {/* Connection Status Indicator */}
          {connectionStatus === "disconnected" && (
            <div
              style={{
                background: "#f8d7da",
                color: "#721c24",
                border: "1px solid #f5c6cb",
                borderRadius: "50px",
                padding: "0.4rem 0.8rem",
                fontSize: "0.8rem",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              }}
            >
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  backgroundColor: "#dc3545",
                  borderRadius: "50%",
                  animation: "pulse 2s infinite",
                }}
              ></div>
              Disconnected
            </div>
          )}

          {connectionStatus === "connecting" && (
            <div
              style={{
                background: "#fff3cd",
                color: "#856404",
                border: "1px solid #ffeaa7",
                borderRadius: "50px",
                padding: "0.4rem 0.8rem",
                fontSize: "0.8rem",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              }}
            >
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  backgroundColor: "#f39c12",
                  borderRadius: "50%",
                  animation: "pulse 1.5s infinite",
                }}
              ></div>
              Connecting...
            </div>
          )}

          {connectionStatus === "connected" && (
            <div
              style={{
                background: "#d4edda",
                color: "#155724",
                border: "1px solid #c3e6cb",
                borderRadius: "50px",
                padding: "0.4rem 0.8rem",
                fontSize: "0.8rem",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              }}
            >
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  backgroundColor: "#28a745",
                  borderRadius: "50%",
                  animation: "pulse 1.5s infinite",
                }}
              ></div>
              Connected
            </div>
          )}

          <style>
            {`
              @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
              }
            `}
          </style>

          {props.isUnusedConfig === false && (
            <AutoBeConfigButton fields={props.configFields || []} />
          )}
          <AutoBeStatusButton />
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
            {connectionStatus === "disconnected" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "3rem",
                  color: "#666",
                  textAlign: "center",
                  gap: "1rem",
                }}
              >
                <div style={{ fontSize: "3rem" }}>⚙️</div>
                <div style={{ fontSize: "1.25rem", fontWeight: "600" }}>
                  Configuration Required
                </div>
                <div
                  style={{
                    fontSize: "1rem",
                    maxWidth: "400px",
                    lineHeight: "1.5",
                  }}
                >
                  Please click the settings button ⚙️ to configure your server
                  connection and API credentials, or start typing to begin
                  setup.
                </div>
              </div>
            )}

            {connectionStatus === "connected" && (
              <AutoBeEventGroupMovie eventGroups={eventGroups} />
            )}
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
            uploadConfig={
              getCurrentConfig().supportAudioEnable
                ? {
                    supportAudio: true,
                  }
                : undefined
            }
            conversate={conversate}
            setError={props.setError}
          />
        </div>
      </div>
    </OverlayProvider>
  );
};
export default AutoBeChatMain;
