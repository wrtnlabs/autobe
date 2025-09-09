import { AutoBeAgent } from "@autobe/agent";
import {
  AutoBeEventOfSerializable,
  AutoBeEventSnapshot,
  AutoBeHistory,
  IAutoBeCompiler,
  IAutoBeCompilerListener,
  IAutoBeHackathonSession,
  IAutoBeRpcListener,
  IAutoBeRpcService,
  IAutoBeTokenUsageJson,
} from "@autobe/interface";
import { AutoBeRpcService } from "@autobe/rpc";
import { ArrayUtil } from "@nestia/e2e";
import OpenAI from "openai";
import path from "path";
import { WebSocketAcceptor, WorkerConnector } from "tgrid";
import { Singleton, sleep_for } from "tstl";
import typia from "typia";

import { AutoBeHackathonConfiguration } from "../../AutoBeHackathonConfiguration";
import { AutoBeHackathonGlobal } from "../../AutoBeHackathonGlobal";
import { IEntity } from "../../structures/IEntity";
import { AutoBeHackathonSessionEventProvider } from "../AutoBeHackathonSessionEventProvider";
import { AutoBeHackathonSessionHistoryProvider } from "../AutoBeHackathonSessionHistoryProvider";

export namespace AutoBeHackathonSessionSocketAcceptor {
  export const connect = async (props: {
    session: IAutoBeHackathonSession.ISummary;
    connection: IEntity;
    acceptor: WebSocketAcceptor<unknown, IAutoBeRpcService, IAutoBeRpcListener>;
  }): Promise<void> => {
    await replay(props);
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
      if (record.enabled === true) break;
    }
    void props.acceptor
      .getDriver()
      .enable(true)
      .catch(() => {});
  };

  export const replay = async (props: {
    session: IAutoBeHackathonSession.ISummary;
    connection: IEntity;
    acceptor: WebSocketAcceptor<unknown, IAutoBeRpcService, IAutoBeRpcListener>;
  }): Promise<void> => {
    const histories: AutoBeHistory[] =
      await AutoBeHackathonSessionHistoryProvider.getAll({
        session: props.session,
      });
    const agent: AutoBeAgent<"chatgpt"> = await startCommunication({
      ...props,
      histories,
    });
    const snapshots: AutoBeEventSnapshot[] =
      await AutoBeHackathonSessionEventProvider.getAll({
        session: props.session,
      });
    const listener = props.acceptor.getDriver();
    for (const s of snapshots) {
      agent.getTokenUsage().assign(s.tokenUsage);
      try {
        await (listener as any)[s.event.type](s.event).catch(() => {});
      } catch {}
      await sleep_for(10);
    }

    // REPLAY NEVER ALLOWS CONVERSATION
    void listener.enable(false).catch(() => {});
  };

  const startCommunication = async (props: {
    session: IAutoBeHackathonSession.ISummary;
    connection: IEntity;
    acceptor: WebSocketAcceptor<unknown, IAutoBeRpcService, IAutoBeRpcListener>;
    histories: AutoBeHistory[] | undefined;
  }): Promise<AutoBeAgent<"chatgpt">> => {
    // CREATE AGENT
    const isOpenAi: boolean = props.session.model.startsWith("openai/");
    const agent: AutoBeAgent<"chatgpt"> = new AutoBeAgent({
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
        semaphore: 4,
      },
      config: {
        locale: "en-US",
        timezone: props.session.timezone,
      },
      compiler: () => compiler.get(),
      histories: props.histories,
    });

    // EVENT LISTENING AND ARCHIVING
    for (const type of typia.misc.literals<AutoBeEventOfSerializable.Type>()) {
      if (type === "jsonParseError" || type === "jsonValidateError") continue;
      agent.on(type, async (event) => {
        const state = agent.getContext().state();
        const tokenUsage: IAutoBeTokenUsageJson = agent
          .getTokenUsage()
          .toJSON();
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
              state:
                state.analyze === null
                  ? null
                  : state.realize?.step === state.analyze.step
                    ? "realize"
                    : state.test?.step === state.analyze.step
                      ? "test"
                      : state.interface?.step === state.analyze.step
                        ? "interface"
                        : state.prisma?.step === state.analyze.step
                          ? "prisma"
                          : "analyze",
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
    return agent;
  };
}

const compiler = new Singleton(async (): Promise<IAutoBeCompiler> => {
  const compiler: WorkerConnector<
    null,
    IAutoBeCompilerListener,
    IAutoBeCompiler
  > = new WorkerConnector(
    null,
    {
      realize: {
        test: {
          onOperation: async () => {},
          onReset: async () => {},
        },
      },
    },
    "process",
  );
  await compiler.connect(
    `${__dirname}/../../executable/compiler${path.extname(__filename)}`,
  );
  return compiler.getDriver();
});
