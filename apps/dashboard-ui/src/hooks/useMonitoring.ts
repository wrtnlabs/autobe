import type { AutoBeEvent, IAutoBeRpcService } from "@autobe/interface";
import { AutoBeListener, type IAutoBeEventGroup } from "@autobe/ui";
import { useCallback, useRef, useState } from "react";
import { WebSocketConnector } from "tgrid";

import type {
  ConnectionStatus,
  PhaseStatus,
  PipelinePhase,
} from "../types/monitoring";

const PHASE_ORDER: PipelinePhase[] = [
  "analyze",
  "database",
  "interface",
  "test",
  "realize",
];

function getPhaseFromEventType(type: string): PipelinePhase | null {
  if (type.startsWith("analyze")) return "analyze";
  if (type.startsWith("database")) return "database";
  if (type.startsWith("interface")) return "interface";
  if (type.startsWith("test")) return "test";
  if (type.startsWith("realize")) return "realize";
  return null;
}

function derivePhaseStatuses(eventGroups: IAutoBeEventGroup[]): PhaseStatus[] {
  const statuses: Record<PipelinePhase, PhaseStatus> = {
    analyze: { phase: "analyze", status: "pending" },
    database: { phase: "database", status: "pending" },
    interface: { phase: "interface", status: "pending" },
    test: { phase: "test", status: "pending" },
    realize: { phase: "realize", status: "pending" },
  };

  for (const group of eventGroups) {
    const phase = getPhaseFromEventType(group.type);
    if (!phase) continue;

    if (group.type.endsWith("Complete")) {
      statuses[phase].status = "completed";
      const event = group.events[group.events.length - 1] as AutoBeEvent & {
        elapsed?: number;
        step?: number;
      };
      if (event.elapsed !== undefined) statuses[phase].elapsed = event.elapsed;
      if (event.step !== undefined) statuses[phase].step = event.step;
    } else if (group.type.endsWith("Start")) {
      if (statuses[phase].status !== "completed") {
        statuses[phase].status = "active";
      }
    } else {
      if (statuses[phase].status === "pending") {
        statuses[phase].status = "active";
      }
    }
  }

  return PHASE_ORDER.map((p) => statuses[p]);
}

export interface UseMonitoringResult {
  connectionStatus: ConnectionStatus;
  eventGroups: IAutoBeEventGroup[];
  phaseStatuses: PhaseStatus[];
  eventCount: number;
  connect: (serverUrl: string) => Promise<void>;
  disconnect: () => Promise<void>;
  errorMessage: string | null;
}

export function useMonitoring(): UseMonitoringResult {
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");
  const [eventGroups, setEventGroups] = useState<IAutoBeEventGroup[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const connectorRef = useRef<WebSocketConnector<
    IAutoBeRpcService,
    object
  > | null>(null);
  const listenerRef = useRef<AutoBeListener | null>(null);

  const connect = useCallback(async (serverUrl: string) => {
    if (connectorRef.current) return;

    setConnectionStatus("connecting");
    setErrorMessage(null);

    try {
      const listener = new AutoBeListener();
      listenerRef.current = listener;

      const onEvent = async (groups: IAutoBeEventGroup[]) => {
        setEventGroups([...groups]);
      };
      listener.on(onEvent);

      const connector = new WebSocketConnector(null, listener.getListener());
      connectorRef.current = connector as WebSocketConnector<
        IAutoBeRpcService,
        object
      >;

      const wsUrl = serverUrl.replace(/^http/, "ws").replace(/\/$/, "");
      await connector.connect(wsUrl);

      setConnectionStatus("connected");
    } catch (err) {
      setConnectionStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Connection failed");
      connectorRef.current = null;
      listenerRef.current = null;
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (connectorRef.current) {
      try {
        await connectorRef.current.close();
      } catch {
        // ignore close errors
      }
      connectorRef.current = null;
      listenerRef.current = null;
    }
    setConnectionStatus("disconnected");
  }, []);

  const phaseStatuses = derivePhaseStatuses(eventGroups);
  const eventCount = eventGroups.reduce((sum, g) => sum + g.events.length, 0);

  return {
    connectionStatus,
    eventGroups,
    phaseStatuses,
    eventCount,
    connect,
    disconnect,
    errorMessage,
  };
}
