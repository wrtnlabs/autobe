import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  IAutoBeAgentSession,
  IAutoBeAgentSessionStorageStrategy,
} from "../structure";

interface AutoBeAgentSessionListContextType {
  sessionList: IAutoBeAgentSession[];
  refreshSessionList: () => void;
}

const AutoBeAgentSessionListContext =
  createContext<AutoBeAgentSessionListContextType | null>(null);

export function AutoBeAgentSessionListProvider({
  children,
  storageStrategy,
}: {
  storageStrategy: IAutoBeAgentSessionStorageStrategy;
  children: ReactNode;
}) {
  const [sessionList, setSessionList] = useState<IAutoBeAgentSession[]>([]);

  const refreshSessionList = useCallback(() => {
    storageStrategy.getSessionList().then(setSessionList);
  }, [storageStrategy]);

  useEffect(() => {
    refreshSessionList();
  }, [storageStrategy]);

  return (
    <AutoBeAgentSessionListContext.Provider
      value={{
        sessionList,
        refreshSessionList,
      }}
    >
      {children}
    </AutoBeAgentSessionListContext.Provider>
  );
}

export function useAutoBeAgentSessionList() {
  const context = useContext(AutoBeAgentSessionListContext);
  if (!context) {
    throw new Error("useAutoBeAgent must be used within a AutoBeAgentProvider");
  }
  return context;
}
