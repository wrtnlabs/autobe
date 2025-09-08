import {
  IAutoBePlaygroundHeader,
  IAutoBeRpcService,
  IAutoBeTokenUsageJson,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

import {
  AutoBeListener,
  AutoBeListenerState,
  IAutoBeEventGroup,
} from "../structure";
import { IAutoBeConfig } from "../types/config";

export interface IAutoBeServiceData {
  service: IAutoBeRpcService;
  listener: AutoBeListener;
  header: IAutoBePlaygroundHeader<ILlmSchema.Model>;
}

export type AutoBeServiceFactory = (
  config: IAutoBeConfig,
) => Promise<IAutoBeServiceData>;

interface AutoBeAgentContextType {
  // Service state
  isServiceReady: boolean;
  isConnecting: boolean;

  // Service data (available when ready)
  eventGroups: IAutoBeEventGroup[];
  tokenUsage: IAutoBeTokenUsageJson | null;
  state: AutoBeListenerState | null;
  header: IAutoBePlaygroundHeader<ILlmSchema.Model> | null;
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
}: {
  serviceFactory?: AutoBeServiceFactory;
  children: ReactNode;
}) {
  // Service state
  const [isServiceReady, setIsServiceReady] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Service data
  const [tokenUsage, setTokenUsage] = useState<IAutoBeTokenUsageJson | null>(
    null,
  );
  const [eventGroups, setEventGroups] = useState<IAutoBeEventGroup[]>([]);
  const [service, setService] = useState<IAutoBeRpcService | null>(null);
  const [listener, setListener] = useState<AutoBeListener | null>(null);
  const [header, setHeader] =
    useState<IAutoBePlaygroundHeader<ILlmSchema.Model> | null>(null);

  // Context-scoped service instance (not global)
  const [serviceInstance, setServiceInstance] =
    useState<IAutoBeServiceData | null>(null);

  // Context-scoped service getter
  const getAutoBeService = useCallback(
    async (
      config: IAutoBeConfig = {} as IAutoBeConfig,
    ): Promise<IAutoBeServiceData> => {
      // Return existing instance if available
      if (serviceInstance && isServiceReady) {
        return serviceInstance;
      }

      // Prevent multiple concurrent creations
      if (isConnecting) {
        throw new Error("Service is already connecting. Please wait.");
      }

      if (!serviceFactory) {
        throw new Error("No service factory provided. Cannot create service.");
      }

      try {
        setIsConnecting(true);

        // Create new service instance
        const newServiceData = await serviceFactory(config);
        setServiceInstance(newServiceData);

        // Update context state
        setService(newServiceData.service);
        setListener(newServiceData.listener);
        setHeader(newServiceData.header);
        setIsServiceReady(true);

        // Set up event listeners
        newServiceData.listener.on(async (e) => {
          newServiceData.service
            .getTokenUsage()
            .then(setTokenUsage)
            .catch(() => {});
          setEventGroups(e);
        });

        // Get initial token usage
        newServiceData.service
          .getTokenUsage()
          .then(setTokenUsage)
          .catch(() => {});

        setIsConnecting(false);
        return newServiceData;
      } catch (error) {
        setIsConnecting(false);
        throw error;
      }
    },
    [serviceFactory, serviceInstance, isServiceReady, isConnecting],
  );

  // Reset service (for reconnection, etc.)
  const resetService = useCallback(() => {
    setServiceInstance(null);
    setIsServiceReady(false);
    setIsConnecting(false);
    setService(null);
    setListener(null);
    setHeader(null);
    setEventGroups([]);
    setTokenUsage(null);
  }, []);

  return (
    <AutoBeAgentContext.Provider
      value={{
        // Service state
        isServiceReady,
        isConnecting,

        // Service data
        eventGroups,
        tokenUsage,
        state: listener?.getState() || null,
        header,
        service,
        listener,

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
