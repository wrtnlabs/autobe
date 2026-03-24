import { IAutoBeRpcService, IAutoBeTokenUsageJson } from "@autobe/interface";
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  AutoBeListener,
  AutoBeListenerState,
  IAutoBeAgentSessionStorageStrategy,
  IAutoBeEventGroup,
} from "../structure";
import { IAutoBeConfig } from "../types/config";
import { useAutoBeAgentSessionList } from "./AutoBeAgentSessionList";
import { useSearchParams } from "./SearchParamsContext";

export interface IAutoBeServiceData {
  service: IAutoBeRpcService;
  listener: AutoBeListener;
  close: () => void | Promise<void>;
  sessionId: string;
}

export type AutoBeServiceFactory = (
  config: IAutoBeConfig,
) => Promise<IAutoBeServiceData>;

export type AutoBeConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected";

interface AutoBeAgentContextType {
  // Service state
  connectionStatus: AutoBeConnectionStatus;

  // Service data (available when ready)
  eventGroups: IAutoBeEventGroup[];
  tokenUsage: IAutoBeTokenUsageJson | null;
  state: AutoBeListenerState | null;
  service: IAutoBeRpcService | null;
  listener: AutoBeListener | null;

  // Service management
  getAutoBeService: (config?: IAutoBeConfig) => Promise<IAutoBeServiceData>;
  resetService: () => void;
}

const AutoBeAgentContext = createContext<AutoBeAgentContextType | null>(null);

export function AutoBeAgentProvider({
  children,
  serviceFactory,
  storageStrategy,
}: {
  serviceFactory: AutoBeServiceFactory;
  children: ReactNode;
  storageStrategy: IAutoBeAgentSessionStorageStrategy;
}) {
  // Service state
  const [connectionStatus, setConnectionStatus] =
    useState<AutoBeConnectionStatus>("disconnected");

  // Service data
  const { searchParams, setSearchParams } = useSearchParams();
  // Use URL parameter for conversation ID - enables bookmark/share support
  const activeConversationId = searchParams.get("session-id") ?? null;

  const [tokenUsage, setTokenUsage] = useState<IAutoBeTokenUsageJson | null>(
    null,
  );
  const [eventGroups, setEventGroups] = useState<IAutoBeEventGroup[]>([]);

  // Store service instance in a ref to avoid React dev mode inspecting
  // the TGrid driver Proxy (which crashes on Symbol property access).
  // connectionStatus state changes drive re-renders instead.
  const serviceInstanceRef = useRef<IAutoBeServiceData | null>(null);

  const { refreshSessionList } = useAutoBeAgentSessionList();
  // Context-scoped service getter
  const getAutoBeService = useCallback(
    async (
      config: IAutoBeConfig = {} as IAutoBeConfig,
    ): Promise<IAutoBeServiceData> => {
      // Return existing instance if available
      if (serviceInstanceRef.current && connectionStatus === "connected") {
        return serviceInstanceRef.current;
      }

      // Prevent multiple concurrent creations
      if (connectionStatus === "connecting") {
        throw new Error("Service is already connecting. Please wait.");
      }

      if (!serviceFactory) {
        throw new Error("No service factory provided. Cannot create service.");
      }

      try {
        setConnectionStatus("connecting");

        // Create new service instance
        const newServiceData = await serviceFactory({
          ...config,
          sessionId: activeConversationId,
        });
        // Wrap the TGrid driver proxy to handle Symbol access from
        // React dev-mode's render logging without crashing.
        newServiceData.service = wrapServiceProxy(newServiceData.service);
        serviceInstanceRef.current = newServiceData;

        setSearchParams((sp) => {
          const newSp = new URLSearchParams(sp);
          newSp.set("session-id", newServiceData.sessionId);
          return newSp;
        });
        setConnectionStatus("connected");

        return newServiceData;
      } catch (error) {
        setConnectionStatus("disconnected");
        throw error;
      }
    },
    [
      serviceFactory,
      connectionStatus,
      activeConversationId,
      searchParams,
    ],
  );

  // Reset service (for reconnection, etc.)
  const resetService = useCallback(() => {
    serviceInstanceRef.current = null;
    setConnectionStatus("disconnected");
    setEventGroups([]);
    setTokenUsage(null);
  }, []);

  useEffect(() => {
    // Close existing connection when switching sessions,
    // but skip if the current service already owns this session
    // (happens when getAutoBeService just created it and set the URL).
    const prev = serviceInstanceRef.current;
    if (prev) {
      if (prev.sessionId === activeConversationId) {
        // Same session — do not tear down the connection we just created
        return;
      }
      void Promise.resolve(prev.close()).catch(() => {});
      serviceInstanceRef.current = null;
      setConnectionStatus("disconnected");
    }

    // Clear stale events immediately
    setEventGroups([]);
    setTokenUsage(null);

    if (activeConversationId === null) {
      return;
    }

    storageStrategy
      .getSession({
        id: activeConversationId,
      })
      .then((v) => {
        if (v === null) {
          return null;
        }
        refreshSessionList();
        // Avoid wiping live websocket replay events with empty storage data.
        // Some strategies only persist histories/token usage and leave events
        // empty, so replacing current groups here can erase already-delivered
        // replay messages such as early userMessage events.
        if (v.events.length > 0) {
          setEventGroups(v.events);
        }
        setTokenUsage(v.tokenUsage);
      })
      .catch(console.error);
  }, [activeConversationId]);

  // Register listener when service connects
  useEffect(() => {
    const instance = serviceInstanceRef.current;
    if (connectionStatus !== "connected" || instance === null) {
      return;
    }

    const onEvent = async (e: IAutoBeEventGroup[]) => {
      setEventGroups(e);
      setTimeout(() => {
        instance.service
          .getTokenUsage()
          .then(setTokenUsage)
          .catch(() => {});
      }, 0);
    };

    instance.listener.on(onEvent);

    instance.service
      .getTokenUsage()
      .then(setTokenUsage)
      .catch(() => {});

    return () => {
      instance.listener.off(onEvent);
    };
  }, [connectionStatus]);

  useEffect(() => {
    const instance = serviceInstanceRef.current;
    if (activeConversationId === null || connectionStatus !== "connected" || instance === null) {
      return;
    }

    const originConversate = instance.service.conversate;
    instance.service.conversate = async (content) => {
      const result = await originConversate(content);
      await storageStrategy.appendHistory({
        id: activeConversationId,
        history: result,
      });
      return result;
    };

    const registerEvent = async (e: IAutoBeEventGroup[]) => {
      await storageStrategy.appendEvent({
        id: activeConversationId,
        events: e,
      });
      await storageStrategy.setTokenUsage({
        id: activeConversationId,
        tokenUsage: await instance.service.getTokenUsage(),
      });
    };

    instance.listener.on(registerEvent);
    return () => {
      instance.service.conversate = originConversate;
      instance.listener.off(registerEvent);
    };
  }, [activeConversationId, connectionStatus]);

  const currentInstance = serviceInstanceRef.current;

  return (
    <AutoBeAgentContext.Provider
      value={{
        // Service state
        connectionStatus,

        // Service data
        eventGroups,
        tokenUsage,
        state: currentInstance?.listener?.getState() ?? null,
        service: currentInstance?.service ?? null,
        listener: currentInstance?.listener ?? null,

        // Service management
        getAutoBeService,
        resetService,
      }}
    >
      {children}
    </AutoBeAgentContext.Provider>
  );
}

export function useAutoBeAgent() {
  const context = useContext(AutoBeAgentContext);
  if (!context) {
    throw new Error("useAutoBeAgent must be used within a AutoBeAgentProvider");
  }
  return context;
}

/**
 * Wrap a TGrid driver Proxy into a plain object so that React dev-mode
 * render logging never touches the Proxy (which crashes on Symbol
 * property access: "Cannot convert a Symbol value to a string").
 */
function wrapServiceProxy(
  service: IAutoBeRpcService,
): IAutoBeRpcService {
  return {
    conversate: (content) => service.conversate(content),
    getFiles: (options) => service.getFiles(options),
    getHistories: () => service.getHistories(),
    getTokenUsage: () => service.getTokenUsage(),
    getPhase: () => service.getPhase(),
  };
}
