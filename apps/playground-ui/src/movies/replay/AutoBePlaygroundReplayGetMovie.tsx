import pApi from "@autobe/playground-api";
import { AutoBeListener } from "@autobe/ui";
import { AlertCircle, Loader2, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

import { getServerUrl } from "../../utils/connection";
import { AutoBeAgentSessionStorageMockStrategy } from "../../strategy/AutoBeAgentSessionStorageMockStrategy";
import { AutoBePlaygroundChatMovie } from "../chat/AutoBePlaygroundChatMovie";

export const AutoBePlaygroundReplayGetMovie = () => {
  const [params] = useState(() => getReplayParams());
  const [next, setNext] = useState<AutoBePlaygroundChatMovie.IProps | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    if (params === null) return;

    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 90) { clearInterval(progressInterval); return 90; }
        return prev + 10;
      });
    }, 300);

    const connect = async () => {
      setLoadingProgress(100);
      clearInterval(progressInterval);

      const isExample = params.type === "example";
      const title = isExample
        ? `AutoBE Playground (Example: ${params.vendor}/${params.project})`
        : "AutoBE Playground (Replay)";

      setNext({
        title,
        storageStrategyFactory: () => new AutoBeAgentSessionStorageMockStrategy(),
        serviceFactory: async () => {
          const listener = new AutoBeListener();
          const host = getServerUrl();

          if (isExample) {
            const { connector, driver } =
              await pApi.functional.autobe.playground.examples.replay(
                { host }, { vendor: params.vendor, project: params.project }, listener.getListener(),
              );
            return {
              service: driver, listener,
              sessionId: `example:${params.vendor}/${params.project}`,
              close: () => connector.close(),
            };
          } else {
            const { connector, driver } =
              await pApi.functional.autobe.playground.sessions.replay(
                { host }, params.sessionId, listener.getListener(),
              );
            return {
              service: driver, listener, sessionId: params.sessionId,
              close: () => connector.close(),
            };
          }
        },
      });
    };

    connect().catch((err) => {
      clearInterval(progressInterval);
      setError(err as Error);
    });
  }, [params]);

  // Invalid params
  if (params === null) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="max-w-md px-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Invalid Parameters</AlertTitle>
            <AlertDescription>
              Missing required URL parameters. Provide either session-id or vendor + project.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Loaded
  if (next !== null) {
    return (
      <AutoBePlaygroundChatMovie
        title={next.title}
        serviceFactory={next.serviceFactory}
        isUnusedConfig={true}
        isReplay={true}
        hideSidebar={true}
        storageStrategyFactory={next.storageStrategyFactory}
      />
    );
  }

  // Error
  if (error !== null) {
    return (
      <div className="flex flex-col h-screen">
        <header className="flex items-center h-14 px-4 bg-primary text-primary-foreground">
          <h1 className="text-lg font-semibold">AutoBE Playground (Replay)</h1>
        </header>
        <div className="flex-1 flex items-center justify-center bg-background">
          <div className="max-w-md px-4">
            <Alert variant="destructive">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle className="text-lg">Failed to Load Replay</AlertTitle>
              <AlertDescription className="mt-2">{error.message}</AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    );
  }

  // Loading
  return (
    <div className="flex flex-col h-screen">
      <header className="relative flex items-center h-14 px-4 bg-primary text-primary-foreground">
        <RotateCcw className="h-5 w-5 mr-3" />
        <h1 className="text-lg font-semibold flex-1">AutoBE Playground (Replay)</h1>
        <Loader2 className="h-5 w-5 animate-spin" />
        <Progress
          value={loadingProgress}
          className="absolute bottom-0 left-0 right-0 h-0.5 rounded-none"
        />
      </header>

      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="max-w-xl w-full px-4 -mt-16">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <Loader2 className="h-20 w-20 animate-spin text-primary" />
              <RotateCcw className="h-8 w-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-xl font-medium">Loading Replay Data</h2>
              <p className="text-muted-foreground">
                {params.type === "example"
                  ? `Example: ${params.vendor} / ${params.project}`
                  : `Session: ${params.sessionId}`}
              </p>
            </div>

            <div className="w-full max-w-lg mt-6 space-y-4">
              <Skeleton className="h-[60px] w-full rounded-lg" />
              <Skeleton className="h-[60px] w-full rounded-lg" />
              <Skeleton className="h-[60px] w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

type ReplayParams =
  | { type: "session"; sessionId: string }
  | { type: "example"; vendor: string; project: string };

const getReplayParams = (): ReplayParams | null => {
  const query = new URLSearchParams(window.location.search);
  const vendor = query.get("vendor");
  const project = query.get("project");
  if (vendor && project) return { type: "example", vendor, project };
  const sessionId = query.get("session-id");
  if (sessionId) return { type: "session", sessionId };
  return null;
};
