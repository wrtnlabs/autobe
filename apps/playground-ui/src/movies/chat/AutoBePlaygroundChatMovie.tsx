import {
  AutoBeAgentProvider,
  AutoBeAgentSessionListProvider,
  AutoBeChatMain,
  AutoBeServiceFactory,
  IAutoBeAgentSessionStorageStrategy,
  IConfigField,
  SearchParamsProvider,
} from "@autobe/ui";
import { useMediaQuery } from "@autobe/ui/hooks";
import { AppBar, Toolbar, Typography } from "@mui/material";
import { useState } from "react";

import { AutoBePlaygroundSidebar } from "./AutoBePlaygroundSidebar";

export function AutoBePlaygroundChatMovie(
  props: AutoBePlaygroundChatMovie.IProps,
) {
  //----
  // STATES
  //----
  const [, setError] = useState<Error | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [storageStrategy] = useState<IAutoBeAgentSessionStorageStrategy>(
    props.storageStrategyFactory(),
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
      {!props.hideAppBar && (
        <AppBar position="relative" component="div">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {props.title ?? "AutoBE Playground"}
            </Typography>
          </Toolbar>
        </AppBar>
      )}
      <div
        style={{
          width: "100%",
          flexGrow: 1,
          display: "flex",
          flexDirection: "row",
          overflow: "hidden",
        }}
      >
        <SearchParamsProvider>
          <AutoBeAgentSessionListProvider storageStrategy={storageStrategy}>
            <AutoBeAgentProvider
              storageStrategy={storageStrategy}
              serviceFactory={props.serviceFactory}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  width: "100%",
                  height: "100%",
                }}
              >
                {!props.hideSidebar && (
                  <AutoBePlaygroundSidebar
                    storageStrategy={storageStrategy}
                    isCollapsed={isMobile ? true : sidebarCollapsed}
                    onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                  />
                )}
                <AutoBeChatMain
                  isUnusedConfig={props.isUnusedConfig ?? false}
                  isMobile={isMobile}
                  setError={setError}
                  configFields={PLAYGROUND_CONFIG_FIELDS}
                  requiredFields={["vendorName"]}
                />
              </div>
            </AutoBeAgentProvider>
          </AutoBeAgentSessionListProvider>
        </SearchParamsProvider>
      </div>
    </div>
  );
}
export namespace AutoBePlaygroundChatMovie {
  export interface IProps {
    title?: string;
    hideAppBar?: boolean;
    hideSidebar?: boolean;
    serviceFactory: AutoBeServiceFactory;
    isUnusedConfig?: boolean;
    storageStrategyFactory: () => IAutoBeAgentSessionStorageStrategy;
  }
}

const PLAYGROUND_CONFIG_FIELDS: IConfigField[] = [
  {
    key: "vendorName",
    label: "Vendor Name",
    type: "text",
    storageKey: "autobe_vendor_name",
    placeholder: "My OpenAI",
    default: "default",
    required: true,
  },
  {
    key: "aiModel",
    label: "AI Model",
    type: "text",
    storageKey: "autobe_ai_model",
    placeholder: "gpt-4.1",
    default: "gpt-4.1",
    suggestions: [
      "gpt-4.1",
      "gpt-4.1-mini",
      "qwen/qwen3-235b-a22b-2507",
      "qwen/qwen3-next-80b-a3b-instruct",
    ],
  },
  {
    key: "baseUrl",
    label: "Base URL",
    type: "text",
    storageKey: "autobe_base_url",
    placeholder: "https://api.openai.com/v1",
    suggestions: [
      "https://api.openai.com/v1",
      "https://openrouter.ai/api/v1",
    ],
  },
  {
    key: "openApiKey",
    label: "API Key (only for new vendors)",
    type: "text",
    storageKey: "autobe_openapi_key_encrypted",
    placeholder: "sk-... (leave empty if vendor already registered)",
    encrypted: true,
  },
];
