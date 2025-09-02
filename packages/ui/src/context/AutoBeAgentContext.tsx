import {
  IAutoBePlaygroundHeader,
  IAutoBeRpcService,
  IAutoBeTokenUsageJson,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import { ReactNode, createContext, useContext, useState } from "react";
import { useEffect } from "react";

import {
  AutoBeListener,
  AutoBeListenerState,
  IAutoBeEventGroup,
} from "../structure";

interface AutoBeAgentContextType {
  eventGroups: IAutoBeEventGroup[];
  tokenUsage: IAutoBeTokenUsageJson | null;
  state: AutoBeListenerState;
  header: IAutoBePlaygroundHeader<ILlmSchema.Model>;
  service: IAutoBeRpcService;
  listener: AutoBeListener;
}

const AutoBeAgentContext = createContext<AutoBeAgentContextType | null>(null);

export function AutoBeAgentProvider({
  children,
  listener,
  service,
  header,
}: {
  listener: AutoBeListener;
  service: IAutoBeRpcService;
  header: IAutoBePlaygroundHeader<ILlmSchema.Model>;
  children: ReactNode;
}) {
  const [tokenUsage, setTokenUsage] = useState<IAutoBeTokenUsageJson | null>(
    null,
  );
  const [eventGroups, setEventGroups] = useState<IAutoBeEventGroup[]>([]);

  useEffect(() => {
    listener.on(async (e) => {
      service
        .getTokenUsage()
        .then(setTokenUsage)
        .catch(() => {});
      setEventGroups(e);
    });
    service
      .getTokenUsage()
      .then(setTokenUsage)
      .catch(() => {});
  }, []);

  return (
    <AutoBeAgentContext.Provider
      value={{
        eventGroups,
        tokenUsage,
        state: listener.getState(),
        header,
        service,
        listener,
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
