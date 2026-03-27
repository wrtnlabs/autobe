import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  IAutoBePlaygroundBenchmark,
  IAutoBePlaygroundSession,
} from "@autobe/interface";
import pApi from "@autobe/playground-api";
import {
  Database,
  FlaskConical,
  Loader2,
  PlusCircle,
  RotateCcw,
  Settings,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { AutoBePlaygroundExampleMovie } from "./movies/examples/AutoBePlaygroundExampleMovie";
import { AutoBePlaygroundReplayIndexMovie } from "./movies/replay/AutoBePlaygroundReplayIndexMovie";
import { AutoBePlaygroundSettingsMovie } from "./movies/settings/AutoBePlaygroundSettingsMovie";
import { getConnection } from "./utils/connection";

export function AutoBePlaygroundReplayIndexApplication() {
  const [tab, setTab] = useState("sessions");

  const [sessions, setSessions] = useState<
    IAutoBePlaygroundSession.ISummary[] | null
  >(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [benchmarks, setBenchmarks] = useState<
    IAutoBePlaygroundBenchmark[] | null
  >(null);

  const [mockOpen, setMockOpen] = useState(false);
  const [mockVendor, setMockVendor] = useState("");
  const [mockProject, setMockProject] = useState("");
  const [creating, setCreating] = useState(false);

  const loadSessions = useCallback(async () => {
    const page = await pApi.functional.autobe.playground.sessions.index(
      getConnection(),
      {},
    );
    setSessions(page.data);
  }, []);

  const loadExamples = useCallback(async () => {
    const list =
      await pApi.functional.autobe.playground.examples.index(getConnection());
    setBenchmarks(list);
  }, []);

  useEffect(() => {
    const load = async () => {
      const progressInterval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);
      await Promise.all([loadSessions(), loadExamples()]);
      setLoadingProgress(100);
      clearInterval(progressInterval);
    };
    load().catch(console.error);
  }, [loadSessions, loadExamples]);

  const benchmarkList = benchmarks ?? [];
  const uniqueVendors = benchmarkList.map((b) => b.vendor);
  const selectedBenchmark = benchmarkList.find((b) => b.vendor === mockVendor);
  const availableProjects = selectedBenchmark
    ? selectedBenchmark.replays.map((r) => r.project)
    : [];

  const handleOpenMockDialog = () => {
    setMockOpen(true);
    if (benchmarkList.length > 0 && !mockVendor) {
      const first = benchmarkList[0];
      setMockVendor(first.vendor);
      if (first.replays.length > 0) setMockProject(first.replays[0].project);
    }
  };

  const handleCreateMock = async () => {
    setCreating(true);
    try {
      const session = await pApi.functional.autobe.playground.sessions.create(
        getConnection(),
        {
          vendor_id: "00000000-0000-0000-0000-000000000000",
          model: "mock",
          mock: { vendor: mockVendor, project: mockProject },
        },
      );
      window.location.href = `/?session-id=${session.id}`;
    } catch (err) {
      console.error("Failed to create mock session:", err);
      setCreating(false);
    }
  };

  const loading = sessions === null || benchmarks === null;

  return (
    <div className="flex flex-col w-full h-full relative">
      {/* Header */}
      <header className="relative flex items-center h-14 px-4 bg-primary text-primary-foreground">
        <h1 className="text-lg font-semibold flex-1">AutoBE Playground</h1>
        <Button
          variant="outline"
          size="sm"
          className="border-primary-foreground/50 text-primary-foreground hover:border-primary-foreground mr-4"
          onClick={handleOpenMockDialog}
        >
          <PlusCircle className="h-4 w-4 mr-1" /> Mock
        </Button>
        {loading && <Loader2 className="h-5 w-5 animate-spin" />}
        {loading && (
          <Progress
            value={loadingProgress}
            className="absolute bottom-0 left-0 right-0 h-0.5 rounded-none"
          />
        )}
      </header>

      <Tabs
        value={tab}
        onValueChange={setTab}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <TabsList className="mx-4 mt-2 w-fit">
          <TabsTrigger value="sessions" className="gap-1.5">
            <Database className="h-4 w-4" /> Sessions
          </TabsTrigger>
          <TabsTrigger value="examples" className="gap-1.5">
            <FlaskConical className="h-4 w-4" /> Examples
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5">
            <Settings className="h-4 w-4" /> Settings
          </TabsTrigger>
        </TabsList>

        {loading && tab !== "settings" ? (
          <div className="flex-1 flex items-center justify-center bg-background">
            <div className="max-w-lg w-full px-4">
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <Loader2 className="h-20 w-20 animate-spin text-primary" />
                  <RotateCcw className="h-8 w-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <h2 className="text-xl font-medium">Loading...</h2>
                <div className="w-full mt-4 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-[120px] w-full rounded-lg" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <TabsContent
              value="sessions"
              className="flex-1 overflow-hidden mt-0"
            >
              {sessions && (
                <AutoBePlaygroundReplayIndexMovie sessions={sessions} />
              )}
            </TabsContent>
            <TabsContent
              value="examples"
              className="flex-1 overflow-hidden mt-0"
            >
              {benchmarks && (
                <AutoBePlaygroundExampleMovie benchmarks={benchmarks} />
              )}
            </TabsContent>
            <TabsContent
              value="settings"
              className="flex-1 overflow-hidden mt-0"
            >
              <AutoBePlaygroundSettingsMovie />
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Mock Session Dialog */}
      <Dialog open={mockOpen} onOpenChange={setMockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Mock Session</DialogTitle>
            <DialogDescription>
              Create a session using example replay data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {benchmarkList.length === 0 ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Vendor / Model</label>
                  <Select
                    value={mockVendor}
                    onValueChange={(v) => {
                      setMockVendor(v);
                      const bench = benchmarkList.find((b) => b.vendor === v);
                      if (bench && bench.replays.length > 0)
                        setMockProject(bench.replays[0].project);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueVendors.map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Project</label>
                  <Select value={mockProject} onValueChange={setMockProject}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProjects.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMockOpen(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateMock}
              disabled={creating || !mockVendor || !mockProject}
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <PlusCircle className="h-4 w-4 mr-1" />
              )}
              {creating ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster position="bottom-center" />
    </div>
  );
}
