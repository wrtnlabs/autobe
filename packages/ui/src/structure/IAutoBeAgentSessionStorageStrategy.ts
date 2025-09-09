import {
  AutoBeEvent,
  AutoBeHistory,
  IAutoBeTokenUsageJson,
} from "@autobe/interface";
import { IAutoBePlaygroundHeader, IAutoBeRpcService } from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

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

export interface IGetAutoBeAgentSessionProps {
  headers: IAutoBePlaygroundHeader<ILlmSchema.Model>;
  listener: AutoBeListener;
  connect: () => Promise<IAutoBeRpcService>;
  sessionId?: string;
  storageStrategy: IAutoBeAgentSessionStorageStrategy;
}

export const getAutoBeAgentSession = async (
  props: IGetAutoBeAgentSessionProps,
) => {
  const service = await props.connect();
  const id = props.sessionId ?? globalThis.crypto.randomUUID();
  const url = new URL(window.location.href);
  url.searchParams.set("sessionId", id);
  window.history.pushState({}, "", url);

  props.listener.on(async (events) => {
    await props.storageStrategy.appendEvent({
      id,
      events,
    });
    await props.storageStrategy.setTokenUsage({
      id,
      tokenUsage: await service.getTokenUsage(),
    });
  });

  return {
    service: {
      getFiles: service.getFiles,
      getHistories: service.getHistories,
      getTokenUsage: service.getTokenUsage,
      conversate: async (content) => {
        const result = await service.conversate(content);
        await props.storageStrategy.appendHistory({
          id,
          history: result,
        });
        return result;
      },
    } satisfies IAutoBeRpcService,
    id,
    listener: props.listener,
    headers: props.headers,
  };
};
