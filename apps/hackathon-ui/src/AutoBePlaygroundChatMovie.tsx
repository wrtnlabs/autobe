import {
  AutoBeAgentProvider,
  AutoBeAgentSessionListProvider,
  AutoBeChatMain,
  AutoBeServiceFactory,
  IAutoBeAgentSessionStorageStrategy,
  IConfigField,
  createAutoBeConfigFields,
  useSearchParams,
} from "@autobe/ui";
import { useMediaQuery } from "@autobe/ui/hooks";
import { AppBar, Toolbar, Typography } from "@mui/material";
import { useState } from "react";
import { Toaster } from "sonner";

import AutoBeChatSidebar from "./components/AutoBeChatSidebar";

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
  const configFields = createAutoBeConfigFields()
    .filter(props.configFilter ?? (() => true))
    .map((v) => ({
      ...v,
      placeholder: undefined,
      type: "list",
      suggestions: [
        "openai/gpt-4.1",
        "openai/gpt-4.1-mini",
        "qwen/qwen3-next-80b-a3b-instruct",
      ],
      default: "openai/gpt-4.1-mini",
    })) satisfies IConfigField[];
  const { searchParams, setSearchParams } = useSearchParams();

  const currentSessionId = searchParams.get("session-id");
  const activeConfigFields = currentSessionId == null ? configFields : [];
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
      <Toaster position="top-center" richColors />
      <AppBar position="relative" component="div">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {props.title ?? "AutoBE Hackathon"}
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
                onDeleteSession={async (id) => {
                  await storageStrategy.deleteSession({ id });
                  if (searchParams.get("session-id") === id) {
                    setSearchParams((sp) => {
                      const newSp = new URLSearchParams(sp);
                      newSp.delete("session-id");
                      return newSp;
                    });
                  }
                }}
              />
              <AutoBeChatMain
                isUnusedConfig={props.isUnusedConfig ?? false}
                isMobile={isMobile}
                setError={setError}
                configFields={activeConfigFields}
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
