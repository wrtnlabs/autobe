import {
  AutoBeAgentProvider,
  AutoBeAgentSessionListProvider,
  AutoBeChatMain,
  AutoBeChatSidebar,
  AutoBeServiceFactory,
  IAutoBeAgentSessionStorageStrategy,
  IConfigField,
  createAutoBeConfigFields,
} from "@autobe/ui";
import { useMediaQuery } from "@autobe/ui/hooks";
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
  const [storageStrategy] = useState<IAutoBeAgentSessionStorageStrategy>(
    props.storageStrategyFactory(),
  );
  // Configuration fields for AutoBE Playground (adds serverUrl to defaults)
  const configFields = createAutoBeConfigFields().filter(
    props.configFilter ?? (() => true),
  );

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
                onSessionSelect={() => {}}
                onDeleteSession={(id) => {
                  storageStrategy.deleteSession({ id });
                }}
              />
              <AutoBeChatMain
                isUnusedConfig={props.isUnusedConfig ?? false}
                isMobile={isMobile}
                setError={setError}
                configFields={configFields}
                style={{
                  backgroundColor: "lightblue",
                }}
                isReplay={props.isReplay}
              />
            </div>
          </AutoBeAgentProvider>
        </AutoBeAgentSessionListProvider>
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
    configFilter?: (config: IConfigField) => boolean;
    isReplay?: boolean;
  }
}
