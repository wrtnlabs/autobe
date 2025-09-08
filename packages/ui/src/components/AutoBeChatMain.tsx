import { AutoBeUserMessageContent } from "@autobe/interface";
import { OverlayProvider, overlay } from "overlay-kit";
import { RefObject, useEffect, useRef, useState } from "react";

import { AutoBeChatUploadBox, AutoBeEventMovie, IAutoBeUploadConfig } from "..";
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

export interface IAutoBeChatMainProps {
  isMobile: boolean;
  conversate: (messages: AutoBeUserMessageContent[]) => Promise<void>;
  setError: (error: Error) => void;
  uploadConfig?: IAutoBeUploadConfig;
  className?: string;
  style?: React.CSSProperties;
  configFields?: IConfigField[];
  onServiceReady?: (service: unknown) => void;
}

export const AutoBeChatMain = (props: IAutoBeChatMainProps) => {
  const bodyContainerRef = useRef<HTMLDivElement>(null);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  const { eventGroups, getAutoBeService } = useAutoBeAgent();
  const [isServiceReady, setIsServiceReady] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

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
    return !!(config.openApiKey && config.serverUrl);
  };

  // Unified service connection handler
  const connectToService = async (): Promise<boolean> => {
    if (isConnecting || isServiceReady) return isServiceReady;

    // Check if we have required config
    if (!hasRequiredConfig()) {
      overlay.open(({ isOpen, close }) => (
        <AutoBeConfigModal
          isOpen={isOpen}
          onClose={close}
          title="Server Connection Required"
          fields={props.configFields || []}
          onSave={() => {
            setTimeout(() => connectToService(), 100);
          }}
        />
      ));
      return false;
    }

    // Connect to service
    try {
      setIsConnecting(true);
      const config = getCurrentConfig();
      const serviceData = await getAutoBeService(config);
      props.onServiceReady?.(serviceData);
      setIsServiceReady(true);
      return true;
    } catch (error) {
      console.error("Failed to connect:", error);
      props.setError(error as Error);
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle user messages
  const handleConversate = async (messages: AutoBeUserMessageContent[]) => {
    const connected = await connectToService();
    if (connected) {
      await props.conversate(messages);
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
    if (eventGroups.length > 0 && hasRequiredConfig() && !isServiceReady) {
      connectToService();
    }
  }, [eventGroups.length]);

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
        {/* Control Buttons - Sticky position in top right */}
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
          <AutoBeConfigButton
            fields={props.configFields || []}
            onSave={() => {
              setTimeout(() => connectToService(), 100);
            }}
          />
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
            {isConnecting && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "2rem",
                  color: "#666",
                  fontSize: "1rem",
                }}
              >
                🔄 Connecting to AutoBE Server...
              </div>
            )}

            {!isServiceReady && !isConnecting && (
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

            {isServiceReady &&
              eventGroups.map((e, index) => (
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
            conversate={handleConversate}
            setError={props.setError}
          />
        </div>
      </div>
    </OverlayProvider>
  );
};
export default AutoBeChatMain;
