import { AutoBeAgent } from "@autobe/agent";
import {
  AutoBeEventOfSerializable,
  AutoBeEventSnapshot,
  AutoBeHistory,
  IAutoBeAgent,
  IAutoBeHackathonSession,
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

import { AutoBeHackathonConfiguration } from "../../../AutoBeHackathonConfiguration";
import { AutoBeHackathonGlobal } from "../../../AutoBeHackathonGlobal";
import { IEntity } from "../../../structures/IEntity";
import { AutoBeHackathonSessionConnectionProvider } from "../AutoBeHackathonSessionConnectionProvider";
import { AutoBeHackathonSessionEventProvider } from "../AutoBeHackathonSessionEventProvider";
import { AutoBeHackathonSessionHistoryProvider } from "../AutoBeHackathonSessionHistoryProvider";
import { AutoBeHackathonSessionCompiler } from "./AutoBeHackathonSessionCompiler";
import { AutoBeHackathonSessionSimulator } from "./AutoBeHackathonSessionSimulator";

export namespace AutoBeHackathonSessionSocketAcceptor {
  export const connect = async (props: {
    session: IAutoBeHackathonSession.ISummary;
    connection: IEntity;
    acceptor: WebSocketAcceptor<unknown, IAutoBeRpcService, IAutoBeRpcListener>;
    query: IAutoBeHackathonSession.IQuery;
  }): Promise<void> => {
    const { histories, snapshots } = await startReplay({
      ...props,
      replay: !props.query?.noReplay,
    });
    const listener: Driver<IAutoBeRpcListener> = props.acceptor.getDriver();
    if (histories.length !== 0)
      while (true) {
        const record =
          await AutoBeHackathonGlobal.prisma.autobe_hackathon_session_aggregates.findFirstOrThrow(
            {
              where: {
                autobe_hackathon_session_id: props.session.id,
              },
              select: {
                enabled: true,
              },
            },
          );
        const nextSnapshots: AutoBeEventSnapshot[] =
          await AutoBeHackathonSessionEventProvider.getNext({
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
    session: IAutoBeHackathonSession.ISummary;
    connection: IEntity;
    acceptor: WebSocketAcceptor<unknown, IAutoBeRpcService, IAutoBeRpcListener>;
  }): Promise<void> => {
    await startReplay({
      ...props,
      replay: true,
    });
  };

  export const simulate = async (props: {
    session: IAutoBeHackathonSession.ISummary;
    connection: IEntity;
    acceptor: WebSocketAcceptor<unknown, IAutoBeRpcService, IAutoBeRpcListener>;
  }): Promise<void> => {
    await startCommunication({
      session: props.session,
      connection: props.connection,
      acceptor: props.acceptor,
      histories: [],
      factory: () => AutoBeHackathonSessionSimulator.agent(),
    });
    const listener: Driver<IAutoBeRpcListener> = props.acceptor.getDriver();
    void listener.enable(true).catch(() => {});
  };

  const startReplay = async (props: {
    session: IAutoBeHackathonSession.ISummary;
    connection: IEntity;
    acceptor: WebSocketAcceptor<unknown, IAutoBeRpcService, IAutoBeRpcListener>;
    replay: boolean;
  }) => {
    const histories: AutoBeHistory[] =
      await AutoBeHackathonSessionHistoryProvider.getAll({
        session: props.session,
      });
    const snapshots: AutoBeEventSnapshot[] =
      await AutoBeHackathonSessionEventProvider.getAll({
        session: props.session,
      });
    const isOpenAi: boolean = props.session.model.startsWith("openai/");
    const agent: AutoBeAgent<"chatgpt"> = await startCommunication({
      ...props,
      histories,
      factory: async () =>
        new AutoBeAgent({
          model: "chatgpt",
          vendor: {
            api: new OpenAI({
              apiKey: isOpenAi
                ? AutoBeHackathonConfiguration.env().OPENAI_API_KEY
                : AutoBeHackathonConfiguration.env().OPENROUTER_API_KEY,
              baseURL: isOpenAi ? undefined : "https://openrouter.ai/api/v1",
            }),
            model: isOpenAi
              ? props.session.model.split("/").at(-1)!
              : props.session.model,
            semaphore: Number(
              AutoBeHackathonConfiguration.env().HACKATHON_SEMAPHORE,
            ),
          },
          config: {
            locale: "en-US",
            timezone: props.session.timezone,
          },
          compiler: () => AutoBeHackathonSessionCompiler.get(),
          histories,
        }),
    });
    const listener: Driver<IAutoBeRpcListener> = props.acceptor.getDriver();
    for (const s of snapshots) {
      agent.getTokenUsage().assign(s.tokenUsage);
      try {
        await (listener as any)[s.event.type](s.event).catch(() => {});
      } catch {}
      await sleep_for(10);
    }

    // REPLAY NEVER ALLOWS CONVERSATION
    void listener.enable(false).catch(() => {});
    return { histories, snapshots };
  };

  const startCommunication = async <
    Agent extends IAutoBeAgent = AutoBeAgent<"chatgpt">,
  >(props: {
    session: IAutoBeHackathonSession.ISummary;
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
        await AutoBeHackathonSessionEventProvider.create({
          session: props.session,
          connection: props.connection,
          snapshot: { event, tokenUsage },
        });
        await AutoBeHackathonGlobal.prisma.autobe_hackathon_session_aggregates.update(
          {
            where: {
              autobe_hackathon_session_id: props.session.id,
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
      AutoBeHackathonGlobal.prisma.autobe_hackathon_session_aggregates.update({
        where: {
          autobe_hackathon_session_id: props.session.id,
        },
        data: {
          enabled: value,
        },
      });
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
              AutoBeHackathonSessionHistoryProvider.create({
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
    void props.acceptor.join().then(() => {
      void AutoBeHackathonSessionConnectionProvider.disconnect(
        props.connection.id,
      ).catch(() => {});
    });
    return agent;
  };
}
