import { AutoBeAgent, AutoBeMockAgent, AutoBeTokenUsage } from "@autobe/agent";
import { AutoBeConfigConstant } from "@autobe/agent/src/constants/AutoBeConfigConstant";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeEventOfSerializable,
  AutoBeEventSnapshot,
  AutoBeExampleProject,
  AutoBeHistory,
  AutoBePhase,
  IAutoBeAgent,
  IAutoBePlaygroundReplay,
  IAutoBePlaygroundSession,
  IAutoBeRpcListener,
  IAutoBeRpcService,
  IAutoBeTokenUsageJson,
} from "@autobe/interface";
import { AutoBeRpcService } from "@autobe/rpc";
import { ArrayUtil } from "@nestia/e2e";
import OpenAI from "openai";
import { Driver, WebSocketAcceptor } from "tgrid";
import { sleep_for } from "tstl";
import typia from "typia";

import { AutoBePlaygroundGlobal } from "../../../AutoBePlaygroundGlobal";
import { IEntity } from "../../../structures/IEntity";
import { AutoBePlaygroundVendorProvider } from "../../vendors/AutoBePlaygroundVendorProvider";
import { AutoBePlaygroundSessionConnectionProvider } from "../AutoBePlaygroundSessionConnectionProvider";
import { AutoBePlaygroundSessionEventProvider } from "../AutoBePlaygroundSessionEventProvider";
import { AutoBePlaygroundSessionHistoryProvider } from "../AutoBePlaygroundSessionHistoryProvider";
import { AutoBePlaygroundSessionProvider } from "../AutoBePlaygroundSessionProvider";
import { AutoBePlaygroundSessionCompiler } from "./AutoBePlaygroundSessionCompiler";

export namespace AutoBePlaygroundSessionSocketAcceptor {
  export const connect = async (props: {
    session: IAutoBePlaygroundSession.ISummary;
    connection: IEntity;
    acceptor: WebSocketAcceptor<unknown, IAutoBeRpcService, IAutoBeRpcListener>;
  }): Promise<void> => {
    const { histories, snapshots } = await startReplay(props);
    const listener: Driver<IAutoBeRpcListener> = props.acceptor.getDriver();
    if (histories.length !== 0)
      while (true) {
        const record =
          await AutoBePlaygroundGlobal.prisma.autobe_playground_session_aggregates.findFirstOrThrow(
            {
              where: {
                autobe_playground_session_id: props.session.id,
              },
              select: { enabled: true },
            },
          );
        const nextSnapshots: AutoBeEventSnapshot[] =
          await AutoBePlaygroundSessionEventProvider.getNext({
            session: props.session,
            lastTime: snapshots.at(-1)?.event.created_at ?? null,
          });
        snapshots.push(...nextSnapshots);
        for (const s of nextSnapshots)
          void (listener as any)[s.event.type](s.event).catch(() => {});
        if (record.enabled === true) break;
        await sleep_for(2_500);
      }
    void listener.enable(true).catch(() => {});
  };

  export const replay = async (props: {
    session: IAutoBePlaygroundSession.ISummary;
    connection: IEntity;
    acceptor: WebSocketAcceptor<unknown, IAutoBeRpcService, IAutoBeRpcListener>;
  }): Promise<void> => {
    const histories: AutoBeHistory[] =
      await AutoBePlaygroundSessionHistoryProvider.getAll({
        session: props.session,
      });
    const snapshots: AutoBeEventSnapshot[] =
      await AutoBePlaygroundSessionEventProvider.getAll({
        session: props.session,
      });

    const replayData: IAutoBePlaygroundReplay = buildReplayFromSnapshots(
      props.session,
      histories,
      snapshots,
    );

    const agent = new AutoBeMockAgent({
      replay: replayData,
      compiler: () => AutoBePlaygroundSessionCompiler.get(),
    });

    await props.acceptor.accept(
      new AutoBeRpcService({
        agent,
        listener: props.acceptor.getDriver(),
        onStart: () => {},
        onComplete: () => {},
      }),
    );
    props.acceptor.ping(500);

    // Read-only replay — push all snapshot events directly
    const listener = props.acceptor.getDriver();
    await sleep_for(100);
    void listener.enable(false).catch(() => {});

    for (const s of snapshots)
      void (listener as any)[s.event.type](s.event).catch(() => {});

    await props.acceptor.join();
  };

  const startReplay = async (props: {
    session: IAutoBePlaygroundSession.ISummary;
    connection: IEntity;
    acceptor: WebSocketAcceptor<unknown, IAutoBeRpcService, IAutoBeRpcListener>;
  }) => {
    const histories: AutoBeHistory[] =
      await AutoBePlaygroundSessionHistoryProvider.getAll({
        session: props.session,
      });
    const snapshots: AutoBeEventSnapshot[] =
      await AutoBePlaygroundSessionEventProvider.getAll({
        session: props.session,
      });

    // Determine if this is a mock session by checking the model field
    // for the "vendor#project" encoding pattern.
    const isMockSession = props.session.model.includes("#");

    // Decrypt vendor API key
    const apiKey = await AutoBePlaygroundVendorProvider.decryptApiKey(
      props.session.vendor.id,
    );
    const agent: IAutoBeAgent =
      isMockSession ||
      apiKey === AutoBePlaygroundSessionProvider.VIRTUAL_API_KEY
        ? await startCommunication({
            ...props,
            histories,
            factory: async () =>
              new AutoBeMockAgent({
                replay: await buildReplayFromExamples(props.session),
                compiler: () => AutoBePlaygroundSessionCompiler.get(),
              }),
          })
        : await startCommunication({
            ...props,
            histories,
            factory: async () =>
              new AutoBeAgent({
                vendor: {
                  api: new OpenAI({
                    apiKey,
                    baseURL: props.session.vendor.baseURL ?? undefined,
                  }),
                  model: props.session.model,
                  semaphore: props.session.vendor.semaphore,
                },
                config: {
                  locale: props.session.locale,
                  timezone: props.session.timezone,
                  timeout:
                    AutoBePlaygroundGlobal.env.PLAYGROUND_TIMEOUT === "NULL"
                      ? null
                      : Number(
                          AutoBePlaygroundGlobal.env.PLAYGROUND_TIMEOUT ??
                            AutoBeConfigConstant.TIMEOUT,
                        ),
                },
                compiler: () => AutoBePlaygroundSessionCompiler.get(),
                histories,
              }),
          });

    const listener: Driver<IAutoBeRpcListener> = props.acceptor.getDriver();
    for (const s of snapshots) {
      (agent.getTokenUsage() as AutoBeTokenUsage).assign(s.tokenUsage);
      void (listener as any)[s.event.type](s.event).catch(() => {});
    }

    // REPLAY NEVER ALLOWS CONVERSATION
    // Small delay to ensure client has processed the WebSocket accept
    // and is ready to receive RPC calls (TGrid race condition)
    await sleep_for(100);
    void listener.enable(false).catch(() => {});
    return { histories, snapshots };
  };

  const startCommunication = async <
    Agent extends IAutoBeAgent = AutoBeAgent,
  >(props: {
    session: IAutoBePlaygroundSession.ISummary;
    connection: IEntity;
    acceptor: WebSocketAcceptor<unknown, IAutoBeRpcService, IAutoBeRpcListener>;
    histories: AutoBeHistory[] | undefined;
    factory: () => Promise<Agent>;
  }): Promise<Agent> => {
    // CREATE AGENT
    const agent: Agent = await props.factory();

    // EVENT LISTENING AND ARCHIVING
    for (const type of typia.misc.literals<AutoBeEventOfSerializable.Type>()) {
      if (type === "jsonParseError" || type === "jsonValidateError") continue;
      agent.on(type, async (event) => {
        const tokenUsage: IAutoBeTokenUsageJson = agent.getTokenUsage();
        await AutoBePlaygroundSessionEventProvider.create({
          session: props.session,
          connection: props.connection,
          snapshot: { event, tokenUsage },
        });
        await AutoBePlaygroundGlobal.prisma.autobe_playground_session_aggregates.update(
          {
            where: {
              autobe_playground_session_id: props.session.id,
            },
            data: {
              token_usage: JSON.stringify(tokenUsage),
              phase: agent.getPhase(),
            },
          },
        );
      });
    }

    // START COMMUNICATION
    const enable = (value: boolean) =>
      AutoBePlaygroundGlobal.prisma.autobe_playground_session_aggregates.update(
        {
          where: {
            autobe_playground_session_id: props.session.id,
          },
          data: { enabled: value },
        },
      );
    await props.acceptor.accept(
      new AutoBeRpcService({
        agent,
        listener: props.acceptor.getDriver(),
        onStart: () => {
          const archive = async () => {
            await enable(false);
          };
          void archive().catch(console.error);
        },
        onComplete: (result) => {
          const archive = async () => {
            await ArrayUtil.asyncMap(result, (history) =>
              AutoBePlaygroundSessionHistoryProvider.create({
                session: props.session,
                connection: props.connection,
                history,
              }),
            );
            await enable(true);
          };
          void archive().catch(console.error);
        },
      }),
    );
    props.acceptor.ping(500);
    void props.acceptor.join().then(() => {
      void AutoBePlaygroundSessionConnectionProvider.close(
        props.connection.id,
      ).catch(() => {});
    });
    return agent;
  };

  /**
   * Build an {@link IAutoBePlaygroundReplay} from stored DB snapshots.
   *
   * Groups the flat snapshot array by phase based on event type prefix.
   */
  const buildReplayFromSnapshots = (
    session: IAutoBePlaygroundSession.ISummary,
    histories: AutoBeHistory[],
    snapshots: AutoBeEventSnapshot[],
  ): IAutoBePlaygroundReplay => {
    const phaseMap: Record<AutoBePhase, AutoBeEventSnapshot[]> = {
      analyze: [],
      database: [],
      interface: [],
      test: [],
      realize: [],
    };

    const PHASE_PREFIXES: Array<[string, AutoBePhase]> = [
      ["analyze", "analyze"],
      ["database", "database"],
      ["interface", "interface"],
      ["test", "test"],
      ["realize", "realize"],
    ];

    const CONVERSATION_TYPES: Set<string> = new Set([
      "userMessage",
      "assistantMessage",
    ]);

    let currentPhase: AutoBePhase | null = null;
    for (const s of snapshots) {
      const type = s.event.type;
      if (CONVERSATION_TYPES.has(type)) continue;
      for (const [prefix, phase] of PHASE_PREFIXES) {
        if (type.startsWith(prefix)) {
          currentPhase = phase;
          break;
        }
      }
      if (currentPhase !== null) {
        phaseMap[currentPhase].push(s);
      }
    }

    return {
      vendor: session.vendor.name,
      project: session.model,
      histories,
      analyze: phaseMap.analyze.length > 0 ? phaseMap.analyze : null,
      database: phaseMap.database.length > 0 ? phaseMap.database : null,
      interface: phaseMap.interface.length > 0 ? phaseMap.interface : null,
      test: phaseMap.test.length > 0 ? phaseMap.test : null,
      realize: phaseMap.realize.length > 0 ? phaseMap.realize : null,
    };
  };

  /**
   * Build an {@link IAutoBePlaygroundReplay} from example storage.
   *
   * The model field of mock sessions encodes both vendor slug and project as
   * `"vendor/model#project"` (e.g. `"openai/gpt-4.1#bbs"`).
   *
   * @internal
   */
  const buildReplayFromExamples = async (
    session: IAutoBePlaygroundSession.ISummary,
  ): Promise<IAutoBePlaygroundReplay> => {
    const separatorIndex = session.model.lastIndexOf("#");
    const vendor: string =
      separatorIndex >= 0
        ? session.model.slice(0, separatorIndex)
        : session.model;
    const project = (
      separatorIndex >= 0 ? session.model.slice(separatorIndex + 1) : ""
    ) as AutoBeExampleProject;

    const safeGetSnapshots = async (
      phase: AutoBePhase,
    ): Promise<AutoBeEventSnapshot[] | null> => {
      const exists = await AutoBeExampleStorage.has({
        vendor,
        project,
        phase,
      });
      if (!exists) return null;
      return AutoBeExampleStorage.getSnapshots({ vendor, project, phase });
    };

    const PHASES: AutoBePhase[] = [
      "realize",
      "test",
      "interface",
      "database",
      "analyze",
    ];
    let historiesPhase: AutoBePhase | null = null;
    for (const phase of PHASES) {
      const exists = await AutoBeExampleStorage.has({
        vendor,
        project,
        phase,
      });
      if (exists) {
        historiesPhase = phase;
        break;
      }
    }

    return {
      vendor,
      project,
      histories:
        historiesPhase !== null
          ? await AutoBeExampleStorage.getHistories({
              vendor,
              project,
              phase: historiesPhase,
            })
          : [],
      analyze: await safeGetSnapshots("analyze"),
      database: await safeGetSnapshots("database"),
      interface: await safeGetSnapshots("interface"),
      test: await safeGetSnapshots("test"),
      realize: await safeGetSnapshots("realize"),
    };
  };
}
