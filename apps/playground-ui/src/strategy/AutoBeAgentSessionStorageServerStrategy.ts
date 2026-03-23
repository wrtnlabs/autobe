import { IAutoBePlaygroundSession } from "@autobe/interface";
import pApi from "@autobe/playground-api";
import {
  AutoBeAgentSession_INIT,
  IAutoBeAgentSession,
  IAutoBeAgentSessionStorageStrategy,
} from "@autobe/ui";
import type { tags } from "typia";

import { getConnection } from "../utils/connection";

/**
 * Server-backed session storage strategy.
 *
 * All persistence is handled by the playground backend server via REST API.
 * Write operations (appendHistory, appendEvent, setTokenUsage) are no-ops
 * because the WebSocket acceptor already persists these server-side.
 */
export class AutoBeAgentSessionStorageServerStrategy implements IAutoBeAgentSessionStorageStrategy {
  // Server already persists histories via WebSocket acceptor — no-op
  async appendHistory(): Promise<void> {}

  // Server already persists events via WebSocket acceptor — no-op
  async appendEvent(): Promise<void> {}

  // Server already persists token usage via aggregate table — no-op
  async setTokenUsage(): Promise<void> {}

  async getSession(
    props: Pick<IAutoBeAgentSession, "id">,
  ): Promise<IAutoBeAgentSession> {
    try {
      const session = await pApi.functional.autobe.playground.sessions.at(
        getConnection(),
        props.id as string & tags.Format<"uuid">,
      );
      return transformSession(session);
    } catch {
      return {
        id: props.id,
        ...AutoBeAgentSession_INIT,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  }

  async getSessionList(): Promise<IAutoBeAgentSession[]> {
    try {
      const page = await pApi.functional.autobe.playground.sessions.index(
        getConnection(),
        { limit: 1000 },
      );
      return page.data.map(transformSummary);
    } catch {
      return [];
    }
  }

  async deleteSession(props: Pick<IAutoBeAgentSession, "id">): Promise<void> {
    await pApi.functional.autobe.playground.sessions.erase(
      getConnection(),
      props.id as string & tags.Format<"uuid">,
    );
  }

  async editSessionTitle(
    props: Pick<IAutoBeAgentSession, "id" | "title">,
  ): Promise<void> {
    await pApi.functional.autobe.playground.sessions.update(
      getConnection(),
      props.id as string & tags.Format<"uuid">,
      { title: props.title || null },
    );
  }
}

function transformSummary(
  s: IAutoBePlaygroundSession.ISummary,
): IAutoBeAgentSession {
  return {
    id: s.id,
    title: s.title ?? s.model,
    history: [],
    tokenUsage: s.token_usage,
    createdAt: new Date(s.created_at),
    updatedAt: new Date(s.completed_at ?? s.created_at),
    events: [],
  };
}

function transformSession(s: IAutoBePlaygroundSession): IAutoBeAgentSession {
  return {
    id: s.id,
    title: s.title ?? s.model,
    history: s.histories,
    tokenUsage: s.token_usage,
    createdAt: new Date(s.created_at),
    updatedAt: new Date(s.completed_at ?? s.created_at),
    events: [],
  };
}
