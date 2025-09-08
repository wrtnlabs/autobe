import {
  AutoBeAgentSession_INIT,
  IAutoBeAgentSession,
  IAutoBeAgentSessionStorageStrategy,
} from "@autobe/ui";

export class AutoBeAgentSessionStorageMockStrategy
  implements IAutoBeAgentSessionStorageStrategy
{
  appendEvent(): Promise<void> {
    return Promise.resolve();
  }
  setTokenUsage(): Promise<void> {
    return Promise.resolve();
  }
  getSession(
    props: Pick<IAutoBeAgentSession, "id">,
  ): Promise<IAutoBeAgentSession> {
    return Promise.resolve({
      id: props.id,
      title: "Mocked Session",
      history: AutoBeAgentSession_INIT.history,
      tokenUsage: AutoBeAgentSession_INIT.tokenUsage,
      createdAt: new Date(),
      updatedAt: new Date(),
      events: AutoBeAgentSession_INIT.events,
    } satisfies IAutoBeAgentSession);
  }
  getSessionList(): Promise<IAutoBeAgentSession[]> {
    return Promise.resolve([]);
  }
  deleteSession(): Promise<void> {
    return Promise.resolve();
  }
  async appendHistory(): Promise<void> {
    return Promise.resolve();
  }
}
