import hApi, { IAutoBeHackathonSession } from "@autobe/hackathon-api";
import {
  IAutoBeAgentSession,
  IAutoBeAgentSessionStorageStrategy,
} from "@autobe/ui";

import { HACKATHON_CODE } from "../constant";
import { useAuthorizationToken } from "../hooks/useAuthorizationToken";

export class AutoBeAgentSessionStorageStrategy
  implements IAutoBeAgentSessionStorageStrategy
{
  appendEvent(): Promise<void> {
    return Promise.resolve();
  }
  setTokenUsage(): Promise<void> {
    return Promise.resolve();
  }
  async getSession(
    props: Pick<IAutoBeAgentSession, "id">,
  ): Promise<IAutoBeAgentSession> {
    const { getToken } = useAuthorizationToken();
    const token = getToken();

    const result: IAutoBeHackathonSession =
      await hApi.autobe.hackathon.participants.sessions.at(
        {
          host: import.meta.env.VITE_API_BASE_URL,
          headers: {
            Authorization: `Bearer ${token.token.access}`,
          },
        },
        HACKATHON_CODE,
        props.id,
      );
    return {
      id: result.id,
      title: result.participant.name,
      history: result.histories,
      tokenUsage: result.token_usage,
      createdAt: new Date(result.created_at),
      updatedAt: new Date(result.completed_at ?? result.created_at),
      events: result.event_snapshots.map((event) => ({
        type: event.event.type,
        events: [event.event],
      })),
    };
  }
  async getSessionList(): Promise<IAutoBeAgentSession[]> {
    const { getToken } = useAuthorizationToken();
    const token = getToken();

    const result: IAutoBeHackathonSession[] =
      await hApi.autobe.hackathon.participants.sessions.index(
        {
          host: import.meta.env.VITE_API_BASE_URL,
          headers: {
            Authorization: `Bearer ${token.token.access}`,
          },
        },
        HACKATHON_CODE,
        {
          page: 1,
          limit: 100,
        },
      );

    console.error("result", result);
    return result.map((session) => ({
      id: session.id,
      title: session.participant.name,
      history: session.histories,
      tokenUsage: session.token_usage,
      createdAt: new Date(session.created_at),
      updatedAt: new Date(session.completed_at ?? session.created_at),
      events: session.event_snapshots.map((event) => ({
        type: event.event.type,
        events: [event.event],
      })),
    }));
  }
  deleteSession(): Promise<void> {
    return Promise.resolve();
  }
  async appendHistory(): Promise<void> {
    return Promise.resolve();
  }
}
