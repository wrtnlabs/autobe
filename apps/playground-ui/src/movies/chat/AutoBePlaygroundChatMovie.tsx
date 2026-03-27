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
import { useState } from "react";

import { StatusPanel } from "../../components/StatusPanel";
import { AutoBePlaygroundSidebar } from "./AutoBePlaygroundSidebar";
import { VendorModelSelector } from "./VendorModelSelector";

export function AutoBePlaygroundChatMovie(
  props: AutoBePlaygroundChatMovie.IProps,
) {
  const [, setError] = useState<Error | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [storageStrategy] = useState<IAutoBeAgentSessionStorageStrategy>(
    props.storageStrategyFactory(),
  );

  const isMinWidthLg = useMediaQuery(useMediaQuery.MIN_WIDTH_LG);
  const isMinWidthXl = useMediaQuery(useMediaQuery.MIN_WIDTH_XL);
  const isMobile = !isMinWidthLg;

  return (
    <div className="w-full h-full flex flex-col relative">
      {!props.hideAppBar && (
        <header className="flex items-center h-14 px-4 bg-primary text-primary-foreground">
          <h1 className="text-lg font-semibold">
            {props.title ?? "AutoBE Playground"}
          </h1>
        </header>
      )}
      <div className="w-full flex-1 flex flex-row overflow-hidden">
        <SearchParamsProvider>
          <AutoBeAgentSessionListProvider storageStrategy={storageStrategy}>
            <AutoBeAgentProvider
              storageStrategy={storageStrategy}
              serviceFactory={props.serviceFactory}
            >
              <div className="flex flex-row w-full h-full">
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
                  hideStatusButton={isMinWidthXl}
                  chatDisabled={
                    !props.isReplay &&
                    (props.mockMode
                      ? !props.mockVendor || !props.mockProject
                      : !props.selectedVendorId || !props.selectedModel)
                  }
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
                        onTimezoneChange={
                          props.onTimezoneChange ?? (() => {})
                        }
                        benchmarks={props.benchmarks ?? []}
                        mockMode={props.mockMode ?? false}
                        onMockModeChange={
                          props.onMockModeChange ?? (() => {})
                        }
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
                {isMinWidthXl && <StatusPanel />}
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
    selectedVendorId?: string | null;
    selectedModel?: string | null;
    selectedLocale?: string;
    selectedTimezone?: string;
    onVendorChange?: (vendorId: string | null) => void;
    onModelChange?: (model: string | null) => void;
    onLocaleChange?: (locale: string) => void;
    onTimezoneChange?: (timezone: string) => void;
    benchmarks?: IAutoBePlaygroundBenchmark[];
    mockMode?: boolean;
    onMockModeChange?: (enabled: boolean) => void;
    mockVendor?: string | null;
    mockProject?: string | null;
    onMockVendorChange?: (vendor: string | null) => void;
    onMockProjectChange?: (project: string | null) => void;
  }
}
