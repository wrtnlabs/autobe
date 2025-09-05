import { AutoBeHistory, IAutoBeTokenUsageJson } from "@autobe/interface";

import { IAutoBeEventGroup } from "./IAutoBeEventGroup";

export interface IAutoBeAgentSession {
  id: string;
  title: string;
  history: AutoBeHistory[];
  tokenUsage: IAutoBeTokenUsageJson;
  createdAt: Date;
  updatedAt: Date;
  events: IAutoBeEventGroup[];
}

export interface IAutoBeAgentSessionStorageStrategy {
  appendHistory: (
    props: Pick<IAutoBeAgentSession, "id" | "history">,
  ) => Promise<void>;
  appendEvent: (
    props: Pick<IAutoBeAgentSession, "id" | "events">,
  ) => Promise<void>;
  setTokenUsage: (
    props: Pick<IAutoBeAgentSession, "id" | "tokenUsage">,
  ) => Promise<void>;
  getSession: (
    props: Pick<IAutoBeAgentSession, "id">,
  ) => Promise<IAutoBeAgentSession>;
  getSessionList: () => Promise<IAutoBeAgentSession[]>;
  deleteSession: (props: Pick<IAutoBeAgentSession, "id">) => Promise<void>;
}
