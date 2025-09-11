import {
  AutoBeEvent,
  AutoBeHistory,
  IAutoBeTokenUsageJson,
} from "@autobe/interface";
import { IAutoBeRpcService } from "@autobe/interface";

import { AutoBeListener } from "./AutoBeListener";
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
  editSessionTitle: (
    props: Pick<IAutoBeAgentSession, "id" | "title">,
  ) => Promise<void>;
}

export const AutoBeAgentSession_INIT = {
  title: "Untitled",
  history: [],
  events: [],
  tokenUsage: [
    "aggregate",
    "facade",
    "analyze",
    "prisma",
    "interface",
    "test",
    "realize",
  ].reduce(
    (acc, cur) => ({
      ...acc,
      [cur]: {
        total: 0,
        input: {
          total: 0,
          cached: 0,
        },
        output: {
          total: 0,
          reasoning: 0,
          accepted_prediction: 0,
          rejected_prediction: 0,
        },
      },
    }),
    {} as IAutoBeTokenUsageJson,
  ),
} satisfies {
  title: string;
  history: AutoBeHistory[];
  events: AutoBeEvent[];
  tokenUsage: IAutoBeTokenUsageJson;
};

export interface IGetAutoBeAgentSessionProps<
  T extends Record<string, unknown>,
> {
  listener: AutoBeListener;
  connect: () => Promise<IAutoBeRpcService>;
  sessionId?: string;
  storageStrategy: IAutoBeAgentSessionStorageStrategy;
  additional?: T;
}
