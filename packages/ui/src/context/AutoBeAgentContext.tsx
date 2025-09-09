import { IAutoBeRpcService, IAutoBeTokenUsageJson } from "@autobe/interface";
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
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
  sessionId: string;
}

export type AutoBeServiceFactory = (
  config: IAutoBeConfig,
) => Promise<IAutoBeServiceData>;

export type AutoBeConnectionStatus =
  | "disconnected" // 연결되지 않음
  | "connecting" // 연결 중
  | "connected"; // 연결 완료 및 활성 상태

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
  const { searchParams } = useSearchParams();
  // Use URL parameter for conversation ID - enables bookmark/share support
  const activeConversationId = searchParams.get("session-id") ?? null;

  const [tokenUsage, setTokenUsage] = useState<IAutoBeTokenUsageJson | null>(
    null,
  );
  const [eventGroups, setEventGroups] = useState<IAutoBeEventGroup[]>([]);

  // Context-scoped service instance (contains service, listener, header)
  const [serviceInstance, setServiceInstance] =
    useState<IAutoBeServiceData | null>(null);

  const { refreshSessionList } = useAutoBeAgentSessionList();
  // Context-scoped service getter
  const getAutoBeService = useCallback(
    async (
      config: IAutoBeConfig = {} as IAutoBeConfig,
    ): Promise<IAutoBeServiceData> => {
      // Return existing instance if available
      if (serviceInstance && connectionStatus === "connected") {
        return serviceInstance;
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
        setServiceInstance(newServiceData);

        const url = new URL(window.location.href);
        url.searchParams.set("session-id", newServiceData.sessionId);
        window.history.pushState({}, "", url);

        setConnectionStatus("connected");

        return newServiceData;
      } catch (error) {
        setConnectionStatus("disconnected");
        throw error;
      }
    },
    [serviceFactory, serviceInstance, connectionStatus],
  );

  // Reset service (for reconnection, etc.)
  const resetService = useCallback(() => {
    setServiceInstance(null);
    setConnectionStatus("disconnected");
    setEventGroups([]);
    setTokenUsage(null);
  }, []);

  useEffect(() => {
    if (activeConversationId === null) {
      setEventGroups([]);
      setTokenUsage(null);
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
        setEventGroups(v.events);
        setTokenUsage(v.tokenUsage);
      })
      .catch(console.error);
  }, [activeConversationId]);

  useEffect(() => {
    if (serviceInstance === null) {
      return;
    }

    serviceInstance.listener.on(async (e) => {
      serviceInstance.service
        .getTokenUsage()
        .then(setTokenUsage)
        .catch(() => {});
      setEventGroups(e);
    });

    serviceInstance.service
      .getTokenUsage()
      .then(setTokenUsage)
      .catch(() => {});
  }, [serviceInstance]);

  useEffect(() => {
    if (activeConversationId === null || serviceInstance === null) {
      return;
    }

    const originConversate = serviceInstance.service.conversate;
    serviceInstance.service.conversate = async (content) => {
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
        tokenUsage: await serviceInstance.service.getTokenUsage(),
      });
    };

    serviceInstance.listener.on(registerEvent);
    return () => {
      serviceInstance.service.conversate = originConversate;
      serviceInstance.listener.off(registerEvent);
    };
  }, [activeConversationId, serviceInstance]);

  return (
    <AutoBeAgentContext.Provider
      value={{
        // Service state
        connectionStatus,

        // Service data
        eventGroups,
        tokenUsage,
        state: serviceInstance?.listener?.getState() ?? null,
        service: serviceInstance?.service ?? null,
        listener: serviceInstance?.listener ?? null,

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
