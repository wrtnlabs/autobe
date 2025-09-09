import {
  AutoBeAgentProvider,
  AutoBeAgentSessionListProvider,
  AutoBeChatMain,
  AutoBeChatSidebar,
  AutoBeServiceFactory,
  IAutoBeAgentSessionStorageStrategy,
  SearchParamsContext,
  createAutoBeConfigFields,
} from "@autobe/ui";
import { useMediaQuery, useSearchParams } from "@autobe/ui/hooks";
import { AppBar, Toolbar, Typography } from "@mui/material";
import { useState } from "react";

export function AutoBePlaygroundChatMovie(
  props: AutoBePlaygroundChatMovie.IProps,
) {
  //----
  // VARIABLES
  //----
  // STATES
  const [, setError] = useState<Error | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const searchParams = useSearchParams();

  // Use URL parameter for conversation ID - enables bookmark/share support
  const activeConversationId =
    searchParams.getSearchParam("session-id") ?? null;

  const [storageStrategy] = useState<IAutoBeAgentSessionStorageStrategy>(
    props.storageStrategyFactory(),
  );

  // Configuration fields for AutoBE Playground (adds serverUrl to defaults)
  const configFields = createAutoBeConfigFields({
    key: "serverUrl",
    label: "Server URL",
    type: "text",
    storageKey: "autobe_server_url",
    placeholder: "http://127.0.0.1:5890",
    default: "http://127.0.0.1:5890",
    required: true,
  });

  //----
  // RENDERERS
  //----

  const isMinWidthLg = useMediaQuery(useMediaQuery.MIN_WIDTH_LG);
  const isMobile = !isMinWidthLg;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      <AppBar position="relative" component="div">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {props.title ?? "AutoBE Playground"}
          </Typography>
        </Toolbar>
      </AppBar>
      <div
        style={{
          width: "100%",
          flexGrow: 1,
          display: "flex",
          flexDirection: "row",
          overflow: "hidden",
        }}
      >
        <SearchParamsContext
          value={new URLSearchParams(window.location.search)}
        >
          <AutoBeAgentSessionListProvider storageStrategy={storageStrategy}>
            <AutoBeAgentProvider
              storageStrategy={storageStrategy}
              serviceFactory={props.serviceFactory}
            >
              {/* Flex container for sidebar and main content */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  width: "100%",
                  height: "100%",
                }}
              >
                <AutoBeChatSidebar
                  storageStrategy={storageStrategy}
                  isCollapsed={isMobile ? false : sidebarCollapsed}
                  onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                  activeSessionId={
                    typeof activeConversationId === "string"
                      ? activeConversationId
                      : (activeConversationId?.at(0) ?? undefined)
                  }
                  onSessionSelect={(id) => {
                    searchParams.setSearchParam("session-id", id);
                  }}
                  onDeleteSession={(id) => {
                    storageStrategy.deleteSession({ id });
                  }}
                />
                <AutoBeChatMain
                  isUnusedConfig={props.isUnusedConfig ?? false}
                  isMobile={isMobile}
                  setError={setError}
                  configFields={configFields}
                  requiredFields={["serverUrl"]} // Playground requires serverUrl
                  style={{
                    backgroundColor: "lightblue",
                  }}
                />
              </div>
            </AutoBeAgentProvider>
          </AutoBeAgentSessionListProvider>
        </SearchParamsContext>
      </div>
    </div>
  );
}
export namespace AutoBePlaygroundChatMovie {
  export interface IProps {
    title?: string;
    serviceFactory: AutoBeServiceFactory;
    isUnusedConfig?: boolean;
    storageStrategyFactory: () => IAutoBeAgentSessionStorageStrategy;
  }
}
