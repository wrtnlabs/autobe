import { IAutoBePlaygroundBenchmark } from "@autobe/interface";
import {
  AutoBeAgentProvider,
  AutoBeAgentSessionListProvider,
  AutoBeChatMain,
  AutoBeServiceFactory,
  IAutoBeAgentSessionStorageStrategy,
  SearchParamsProvider,
} from "@autobe/ui";
import { useMediaQuery } from "@autobe/ui/hooks";
import { AppBar, Toolbar, Typography } from "@mui/material";
import { useState } from "react";

import { AutoBePlaygroundSidebar } from "./AutoBePlaygroundSidebar";
import { VendorModelSelector } from "./VendorModelSelector";

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
                  isUnusedConfig={true}
                  isReplay={props.isReplay}
                  isMobile={isMobile}
                  setError={setError}
                  disconnectedContent={
                    !props.isReplay ? (
                      <VendorModelSelector
                        selectedVendorId={props.selectedVendorId ?? null}
                        selectedModel={props.selectedModel ?? null}
                        locale={props.selectedLocale ?? ""}
                        timezone={props.selectedTimezone ?? ""}
                        onVendorChange={props.onVendorChange ?? (() => {})}
                        onModelChange={props.onModelChange ?? (() => {})}
                        onLocaleChange={props.onLocaleChange ?? (() => {})}
                        onTimezoneChange={props.onTimezoneChange ?? (() => {})}
                        benchmarks={props.benchmarks ?? []}
                        mockMode={props.mockMode ?? false}
                        onMockModeChange={props.onMockModeChange ?? (() => {})}
                        mockVendor={props.mockVendor ?? null}
                        mockProject={props.mockProject ?? null}
                        onMockVendorChange={
                          props.onMockVendorChange ?? (() => {})
                        }
                        onMockProjectChange={
                          props.onMockProjectChange ?? (() => {})
                        }
                      />
                    ) : undefined
                  }
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
    isReplay?: boolean;
    serviceFactory: AutoBeServiceFactory;
    isUnusedConfig?: boolean;
    storageStrategyFactory: () => IAutoBeAgentSessionStorageStrategy;

    // Vendor/model/locale/timezone selection
    selectedVendorId?: string | null;
    selectedModel?: string | null;
    selectedLocale?: string;
    selectedTimezone?: string;
    onVendorChange?: (vendorId: string | null) => void;
    onModelChange?: (model: string | null) => void;
    onLocaleChange?: (locale: string) => void;
    onTimezoneChange?: (timezone: string) => void;

    // Mock mode
    benchmarks?: IAutoBePlaygroundBenchmark[];
    mockMode?: boolean;
    onMockModeChange?: (enabled: boolean) => void;
    mockVendor?: string | null;
    mockProject?: string | null;
    onMockVendorChange?: (vendor: string | null) => void;
    onMockProjectChange?: (project: string | null) => void;
  }
}
