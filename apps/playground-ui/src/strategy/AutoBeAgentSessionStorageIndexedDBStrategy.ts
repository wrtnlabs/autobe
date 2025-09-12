import { AutoBeHistory, IAutoBeTokenUsageJson } from "@autobe/interface";
import {
  AutoBeAgentSession_INIT,
  IAutoBeAgentSession,
  IAutoBeAgentSessionStorageStrategy,
  IAutoBeEventGroup,
} from "@autobe/ui";

export class AutoBeAgentSessionStorageIndexedDBStrategy
  implements IAutoBeAgentSessionStorageStrategy
{
  static get supported(): boolean {
    /** @reference https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB */
    const idb: IDBFactory = window.indexedDB;
    return idb !== undefined;
  }

  private connection: IDBOpenDBRequest;
  private AutoBeAgentSession_INITializedPromise: Promise<void>;
  private AutoBeAgentSession_INITialized: boolean;
  private readonly dbName: string;

  constructor(dbName: string = "autobe_agent_storage") {
    this.dbName = dbName;
    this.AutoBeAgentSession_INITialized = false;

    const req = window.indexedDB.open(this.dbName, 2);
    this.AutoBeAgentSession_INITializedPromise = new Promise(
      (resolve, reject) => {
        req.onerror = (event) => {
          reject(event);
          console.error("Error opening database", event);
        };
        req.onupgradeneeded = function (event) {
          console.log("Database upgraded", event);
          const db: IDBDatabase = this.result;
          if (!db.objectStoreNames.contains("sessions")) {
            db.createObjectStore("sessions", { keyPath: "id" });
          }
        };
        req.onsuccess = (event) => {
          console.log("Database opened successfully", event);
          this.AutoBeAgentSession_INITialized = true;
          resolve();
        };
      },
    );
    this.connection = req;
  }

  private async getObjectStore(name: string, mode: "readonly" | "readwrite") {
    await this.AutoBeAgentSession_INITializedPromise;
    if (!this.AutoBeAgentSession_INITialized) {
      throw new Error("Database not AutoBeAgentSession_INITialized");
    }
    return this.connection.result.transaction(name, mode).objectStore(name);
  }

  async appendHistory(props: {
    id: string;
    history: AutoBeHistory[];
  }): Promise<void> {
    const store = await this.getObjectStore("sessions", "readwrite");
    const prev = await promisifyIDBRequest(store.get(props.id));
    if (prev === undefined) {
      store.add({
        id: props.id,
        title: AutoBeAgentSession_INIT.title,
        history: props.history,
        tokenUsage: AutoBeAgentSession_INIT.tokenUsage,
        events: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return;
    }

    await promisifyIDBRequest(
      store.put({
        ...prev,
        history: [...prev.history, ...props.history],
      }),
    );
  }

  async appendEvent(props: {
    id: string;
    events: IAutoBeEventGroup[];
  }): Promise<void> {
    const store = await this.getObjectStore("sessions", "readwrite");
    const prev = await promisifyIDBRequest(store.get(props.id));
    if (prev === undefined) {
      store.add({
        id: props.id,
        title: AutoBeAgentSession_INIT.title,
        history: AutoBeAgentSession_INIT.history,
        tokenUsage: AutoBeAgentSession_INIT.tokenUsage,
        events: props.events,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return;
    }

    await promisifyIDBRequest(
      store.put({
        ...prev,
        events: [...prev.events, ...props.events],
      }),
    );
  }

  async setTokenUsage(props: {
    id: string;
    tokenUsage: IAutoBeTokenUsageJson;
  }): Promise<void> {
    const store = await this.getObjectStore("sessions", "readwrite");
    const prev = await promisifyIDBRequest(store.get(props.id));
    if (prev === undefined) {
      store.add({
        id: props.id,
        title: AutoBeAgentSession_INIT.title,
        history: AutoBeAgentSession_INIT.history,
        tokenUsage: props.tokenUsage,
        events: AutoBeAgentSession_INIT.events,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return;
    }

    await promisifyIDBRequest(
      store.put({
        ...prev,
        tokenUsage: props.tokenUsage,
        updatedAt: new Date(),
      }),
    );
  }

  async getSession(props: { id: string }) {
    const store = await this.getObjectStore("sessions", "readonly");
    const prev = await promisifyIDBRequest(store.get(props.id));
    return prev;
  }

  async getSessionList(): Promise<IAutoBeAgentSession[]> {
    const store = await this.getObjectStore("sessions", "readonly");
    console.log(store);
    const prev = await promisifyIDBRequest(store.getAll());
    console.log(prev);
    return prev;
  }

  async deleteSession(props: { id: string }): Promise<void> {
    const store = await this.getObjectStore("sessions", "readwrite");
    await promisifyIDBRequest(store.delete(props.id));
  }

  async editSessionTitle(
    props: Pick<IAutoBeAgentSession, "id" | "title">,
  ): Promise<void> {
    const store = await this.getObjectStore("sessions", "readwrite");
    const prev = await promisifyIDBRequest(store.get(props.id));
    if (prev === undefined) {
      return;
    }
    await promisifyIDBRequest(store.put({ ...prev, title: props.title }));
  }
}

const promisifyIDBRequest = <T>(request: IDBRequest<T>): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};
