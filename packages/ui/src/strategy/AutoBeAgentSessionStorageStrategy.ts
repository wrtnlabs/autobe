import { AutoBeEventSnapshot } from "@autobe/interface";

import { useSessionStorage } from "../hooks/useSessionStorage";
import {
  IAutoBeAgentSession,
  IAutoBeAgentSessionStorageStrategy,
} from "../structure";

const SESSION_KEY = "autobe_session_list";

export class AutoBeAgentSessionStorageStrategy implements IAutoBeAgentSessionStorageStrategy {
  appendEvent(): Promise<void> {
    return Promise.resolve();
  }
  setTokenUsage(): Promise<void> {
    return Promise.resolve();
  }

  async getSession(
    props: Pick<IAutoBeAgentSession, "id">,
  ): Promise<IAutoBeAgentSession> {
    const { getItem } = useSessionStorage();

    const session = getItem(SESSION_KEY);
    if (!session) {
      throw new Error("Session not found");
    }

    const sessionList = JSON.parse(session);

    if (sessionList instanceof Array === false) {
      throw new Error("Session list is not an array");
    }

    const result = sessionList.find(
      (s: IAutoBeAgentSession) => s.id === props.id,
    );

    return {
      id: result.id,
      title: result.participant.name,
      history: result.histories,
      tokenUsage: result.token_usage,
      createdAt: new Date(result.created_at),
      updatedAt: new Date(result.completed_at ?? result.created_at),
      events: result.event_snapshots.map((event: AutoBeEventSnapshot) => ({
        type: event.event.type,
        events: [event.event],
      })),
    };
  }

  async getSessionList(): Promise<IAutoBeAgentSession[]> {
    const { getItem } = useSessionStorage();
    const sessionList = getItem(SESSION_KEY);
    if (!sessionList) {
      throw new Error("Session list not found");
    }

    const result = JSON.parse(sessionList);
    if (result instanceof Array === false) {
      throw new Error("Session list is not an array");
    }

    return result.map((session) => ({
      id: session.id,
      title: session.title ?? "Untitled",
      history: [],
      tokenUsage: session.token_usage,
      createdAt: new Date(session.created_at),
      updatedAt: new Date(session.completed_at ?? session.created_at),
      completedAt: session.completed_at,
      events: [],
      phase: session.phase,
      model: session.model,
    }));
  }

  async deleteSession(props: Pick<IAutoBeAgentSession, "id">): Promise<void> {
    const { getItem, setItem } = useSessionStorage();

    const sessionList = getItem(SESSION_KEY);
    if (!sessionList) {
      throw new Error("Session list not found");
    }

    const result = JSON.parse(sessionList);
    if (result instanceof Array === false) {
      throw new Error("Session list is not an array");
    }

    setItem(
      SESSION_KEY,
      JSON.stringify(
        result.filter((s: IAutoBeAgentSession) => s.id !== props.id),
      ),
    );
  }

  async appendHistory(): Promise<void> {
    return Promise.resolve();
  }

  async editSessionTitle(
    props: Pick<IAutoBeAgentSession, "id" | "title">,
  ): Promise<void> {
    const { getItem, setItem } = useSessionStorage();

    const sessionList = getItem(SESSION_KEY);
    if (!sessionList) {
      throw new Error("Session list not found");
    }

    const result = JSON.parse(sessionList);
    if (result instanceof Array === false) {
      throw new Error("Session list is not an array");
    }

    const session = result.find((s: IAutoBeAgentSession) => s.id === props.id);
    if (!session) {
      throw new Error("Session not found");
    }

    session.title = props.title;
    setItem(SESSION_KEY, JSON.stringify(result));
  }
}
