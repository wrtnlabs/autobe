import { AutoBeAgent } from "@autobe/agent";
import { AutoBeConfigConstant } from "@autobe/agent/src/constants/AutoBeConfigConstant";
import {
  AutoBeEventOfSerializable,
  AutoBeEventSnapshot,
  AutoBeHistory,
  IAutoBeAgent,
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
    await startReplay(props);
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

    // Decrypt vendor API key
    const apiKey = await AutoBePlaygroundVendorProvider.decryptApiKey(
      props.session.vendor.id,
    );
    const agent: AutoBeAgent = await startCommunication({
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
      agent.getTokenUsage().assign(s.tokenUsage);
      void (listener as any)[s.event.type](s.event).catch(() => {});
      await sleep_for(10);
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
}
