import { IAutoBePlaygroundBenchmark } from "@autobe/interface";
import pApi from "@autobe/playground-api";
import { AutoBeListener, IAutoBeConfig, IAutoBeServiceData } from "@autobe/ui";
import { FlaskConical, Menu, MessageSquare, Settings } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/utils";

import { AutoBePlaygroundChatMovie } from "./movies/chat/AutoBePlaygroundChatMovie";
import { AutoBePlaygroundExampleMovie } from "./movies/examples/AutoBePlaygroundExampleMovie";
import { AutoBePlaygroundSettingsMovie } from "./movies/settings/AutoBePlaygroundSettingsMovie";
import { AutoBeAgentSessionStorageServerStrategy } from "./strategy/AutoBeAgentSessionStorageServerStrategy";
import { getConnection, getServerUrl } from "./utils/connection";
import { getGlobalConfig } from "./utils/globalConfig";

type ActiveView = "chat" | "examples";

const TAB_HASHES: Record<string, ActiveView> = {
  "#examples": "examples",
};

export function AutoBePlaygroundApplication() {
  const [activeView, setActiveView] = useState<ActiveView>(() => {
    const hash = window.location.hash;
    return TAB_HASHES[hash] ?? "chat";
  });
  const [settingsOpen, setSettingsOpen] = useState(
    window.location.hash === "#settings",
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [selectedLocale, setSelectedLocale] = useState<string>(
    window.navigator.language,
  );
  const [selectedTimezone, setSelectedTimezone] = useState<string>(
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  const [mockMode, setMockMode] = useState(false);
  const [mockVendor, setMockVendor] = useState<string | null>(null);
  const [mockProject, setMockProject] = useState<string | null>(null);
  const [benchmarks, setBenchmarks] = useState<
    IAutoBePlaygroundBenchmark[] | null
  >(null);

  useEffect(() => {
    getGlobalConfig().then((cfg) => {
      if (cfg.default_vendor_id && !selectedVendorId)
        setSelectedVendorId(cfg.default_vendor_id);
      if (cfg.default_model && !selectedModel)
        setSelectedModel(cfg.default_model);
      if (cfg.locale) setSelectedLocale(cfg.locale);
    });
  }, []);

  const loadBenchmarks = useCallback(async () => {
    const list = await pApi.functional.autobe.playground.examples.index(
      getConnection(),
    );
    setBenchmarks(list);
  }, []);

  useEffect(() => {
    loadBenchmarks().catch(console.error);
  }, [loadBenchmarks]);

  const navigate = (view: ActiveView) => {
    setActiveView(view);
    const hash = view === "chat" ? "#chat" : "#examples";
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}${hash}`,
    );
    setMobileMenuOpen(false);
  };

  const serviceFactory = async (
    config: IAutoBeConfig,
  ): Promise<IAutoBeServiceData> => {
    const connection = { host: getServerUrl() };
    const listener = new AutoBeListener();

    let sessionId: string;

    if (config.sessionId != null && typeof config.sessionId === "string") {
      sessionId = config.sessionId;
    } else {
      if (!selectedVendorId)
        throw new Error("No vendor selected. Please select a vendor before starting a session.");
      if (!selectedModel)
        throw new Error("No model selected. Please select a model before starting a session.");

      const session =
        await pApi.functional.autobe.playground.sessions.create(connection, {
          vendor_id: selectedVendorId,
          model: selectedModel,
          locale: selectedLocale,
          timezone: selectedTimezone,
          ...(mockMode && mockVendor && mockProject
            ? { mock: { vendor: mockVendor, project: mockProject } }
            : {}),
        });
      sessionId = session.id;
    }

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
    <div className="flex h-screen w-screen bg-background">
      {/* Desktop sidebar nav */}
      <aside className="hidden lg:flex flex-col w-14 border-r bg-sidebar-background items-center py-3 gap-2">
        <div className="flex-1 flex flex-col items-center gap-1">
          <Button
            variant={activeView === "chat" ? "secondary" : "ghost"}
            size="icon"
            className="h-10 w-10"
            onClick={() => navigate("chat")}
            title="Chat"
          >
            <MessageSquare className="h-5 w-5" />
          </Button>
          <Button
            variant={activeView === "examples" ? "secondary" : "ghost"}
            size="icon"
            className="h-10 w-10"
            onClick={() => navigate("examples")}
            title="Examples"
          >
            <FlaskConical className="h-5 w-5" />
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={() => setSettingsOpen(true)}
          title="Settings"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center h-12 px-3 bg-background border-b">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="ml-2 text-sm font-semibold">AutoBE Playground</span>
      </div>

      {/* Mobile nav sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-56 p-4">
          <SheetTitle className="text-lg font-bold mb-4">AutoBE</SheetTitle>
          <nav className="space-y-1">
            <button
              className={cn(
                "w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                activeView === "chat"
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-accent",
              )}
              onClick={() => navigate("chat")}
            >
              <MessageSquare className="h-4 w-4" /> Chat
            </button>
            <button
              className={cn(
                "w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                activeView === "examples"
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-accent",
              )}
              onClick={() => navigate("examples")}
            >
              <FlaskConical className="h-4 w-4" /> Examples
            </button>
            <button
              className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
              onClick={() => {
                setSettingsOpen(true);
                setMobileMenuOpen(false);
              }}
            >
              <Settings className="h-4 w-4" /> Settings
            </button>
          </nav>
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <main className={cn("flex-1 overflow-hidden", "lg:pt-0 pt-12")}>
        {activeView === "chat" && (
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
        {activeView === "examples" && benchmarks && (
          <AutoBePlaygroundExampleMovie benchmarks={benchmarks} />
        )}
      </main>

      {/* Settings dialog overlay */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>
          <AutoBePlaygroundSettingsMovie />
        </DialogContent>
      </Dialog>

      <Toaster position="bottom-center" />
    </div>
  );
}
