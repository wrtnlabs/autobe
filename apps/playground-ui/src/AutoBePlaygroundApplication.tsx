import { IAutoBePlaygroundBenchmark } from "@autobe/interface";
import pApi from "@autobe/playground-api";
import { AutoBeListener, IAutoBeConfig, IAutoBeServiceData } from "@autobe/ui";
import { Chat, Science, Settings } from "@mui/icons-material";
import {
  AppBar,
  Tab,
  Tabs,
  Toolbar,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";

import { AutoBePlaygroundChatMovie } from "./movies/chat/AutoBePlaygroundChatMovie";
import { AutoBePlaygroundExampleMovie } from "./movies/examples/AutoBePlaygroundExampleMovie";
import { AutoBePlaygroundSettingsMovie } from "./movies/settings/AutoBePlaygroundSettingsMovie";
import { AutoBeAgentSessionStorageServerStrategy } from "./strategy/AutoBeAgentSessionStorageServerStrategy";
import { getConnection, getServerUrl } from "./utils/connection";
import { getGlobalConfig } from "./utils/globalConfig";

const TAB_HASHES = ["#chat", "#examples", "#settings"] as const;

export function AutoBePlaygroundApplication() {
  const theme = useTheme();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState(() => {
    const hash = window.location.hash;
    if (hash === "#examples") return 1;
    if (hash === "#settings") return 2;
    return 0;
  });

  // Vendor/model/locale/timezone selection state
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [selectedLocale, setSelectedLocale] = useState<string>(
    window.navigator.language,
  );
  const [selectedTimezone, setSelectedTimezone] = useState<string>(
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );

  // Mock mode state
  const [mockMode, setMockMode] = useState(false);
  const [mockVendor, setMockVendor] = useState<string | null>(null);
  const [mockProject, setMockProject] = useState<string | null>(null);

  // Examples state
  const [benchmarks, setBenchmarks] = useState<
    IAutoBePlaygroundBenchmark[] | null
  >(null);

  // Seed defaults from global config
  useEffect(() => {
    getGlobalConfig().then((cfg) => {
      if (cfg.default_vendor_id && !selectedVendorId) {
        setSelectedVendorId(cfg.default_vendor_id);
      }
      if (cfg.default_model && !selectedModel) {
        setSelectedModel(cfg.default_model);
      }
      if (cfg.locale) {
        setSelectedLocale(cfg.locale);
      }
    });
  }, []);

  // Load benchmarks
  const loadBenchmarks = useCallback(async () => {
    const list = await pApi.functional.autobe.playground.examples.index(
      getConnection(),
    );
    setBenchmarks(list);
  }, []);

  useEffect(() => {
    loadBenchmarks().catch(console.error);
  }, [loadBenchmarks]);

  // Playground service factory — reads vendor/model from component state
  const serviceFactory = async (
    config: IAutoBeConfig,
  ): Promise<IAutoBeServiceData> => {
    const connection = { host: getServerUrl() };
    const listener = new AutoBeListener();

    let sessionId: string;

    if (config.sessionId != null && typeof config.sessionId === "string") {
      // Reconnecting to existing session
      sessionId = config.sessionId;
    } else {
      if (!selectedVendorId) {
        throw new Error(
          "No vendor selected. Please select a vendor before starting a session.",
        );
      }
      if (!selectedModel) {
        throw new Error(
          "No model selected. Please select a model before starting a session.",
        );
      }

      const session =
        await pApi.functional.autobe.playground.sessions.create(connection, {
          vendor_id: selectedVendorId,
          model: selectedModel,
          locale: selectedLocale,
          timezone: selectedTimezone,
          ...(mockMode && mockVendor && mockProject
            ? {
                mock: {
                  vendor: mockVendor,
                  project: mockProject,
                },
              }
            : {}),
        });
      sessionId = session.id;
    }

    // Connect to session via WebSocket
    const { driver: service, connector } =
      await pApi.functional.autobe.playground.sessions.connect(
        connection,
        sessionId,
        listener.getListener(),
      );

    return {
      service,
      sessionId,
      listener,
      close: () => connector.close(),
    } satisfies IAutoBeServiceData;
  };

  return (
    <div
      ref={scrollRef}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <AppBar position="relative" component="div">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            AutoBE Playground
          </Typography>
          <Tabs
            value={tab}
            onChange={(_, v) => {
              setTab(v);
              window.history.replaceState(
                null,
                "",
                `${window.location.pathname}${window.location.search}${TAB_HASHES[v]}`,
              );
            }}
            sx={{
              "& .MuiTab-root": {
                color: alpha(theme.palette.common.white, 0.7),
                minHeight: 64,
              },
              "& .MuiTab-root.Mui-selected": {
                color: theme.palette.common.white,
              },
              "& .MuiTabs-indicator": {
                bgcolor: theme.palette.common.white,
              },
            }}
          >
            <Tab
              icon={<Chat sx={{ fontSize: 18 }} />}
              iconPosition="start"
              label="Chat"
            />
            <Tab
              icon={<Science sx={{ fontSize: 18 }} />}
              iconPosition="start"
              label="Examples"
            />
            <Tab
              icon={<Settings sx={{ fontSize: 18 }} />}
              iconPosition="start"
              label="Settings"
            />
          </Tabs>
        </Toolbar>
      </AppBar>

      <div style={{ width: "100%", flex: 1, overflow: "hidden" }}>
        {tab === 0 && (
          <AutoBePlaygroundChatMovie
            hideAppBar
            serviceFactory={serviceFactory}
            storageStrategyFactory={() =>
              new AutoBeAgentSessionStorageServerStrategy()
            }
            selectedVendorId={selectedVendorId}
            selectedModel={selectedModel}
            selectedLocale={selectedLocale}
            selectedTimezone={selectedTimezone}
            onVendorChange={setSelectedVendorId}
            onModelChange={setSelectedModel}
            onLocaleChange={setSelectedLocale}
            onTimezoneChange={setSelectedTimezone}
            benchmarks={benchmarks ?? []}
            mockMode={mockMode}
            onMockModeChange={setMockMode}
            mockVendor={mockVendor}
            mockProject={mockProject}
            onMockVendorChange={setMockVendor}
            onMockProjectChange={setMockProject}
          />
        )}
        {tab === 1 && benchmarks && (
          <AutoBePlaygroundExampleMovie benchmarks={benchmarks} />
        )}
        {tab === 2 && <AutoBePlaygroundSettingsMovie />}
      </div>
    </div>
  );
}
