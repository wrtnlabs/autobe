import {
  IAutoBePlaygroundSession,
  IAutoBeRpcListener,
  IAutoBeRpcService,
} from "@autobe/interface";
import { WebSocketAcceptor } from "tgrid";

import { AutoBePlaygroundGlobal } from "../../AutoBePlaygroundGlobal";
import { IEntity } from "../../structures/IEntity";
import { AutoBePlaygroundSessionConnectionProvider } from "./AutoBePlaygroundSessionConnectionProvider";
import { AutoBePlaygroundSessionProvider } from "./AutoBePlaygroundSessionProvider";
import { AutoBePlaygroundSessionSocketAcceptor } from "./acceptors/AutoBePlaygroundSessionSocketAcceptor";

export namespace AutoBePlaygroundSessionSocketProvider {
  export const connect = async (props: {
    id: string;
    acceptor: WebSocketAcceptor<void, IAutoBeRpcService, IAutoBeRpcListener>;
  }): Promise<void> => {
    const session: IAutoBePlaygroundSession.ISummary = await findSession(props);

    // Block connect for sessions whose vendor has been soft-deleted
    if (session.vendor.deleted_at !== null) {
      await props.acceptor.reject(
        1008,
        "Vendor has been deleted; only replay is allowed",
      );
      return;
    }

    // Block duplicate connections to the same session
    const activeConnection =
      await AutoBePlaygroundGlobal.prisma.autobe_playground_session_connections.findFirst(
        {
          where: {
            autobe_playground_session_id: session.id,
            disconnected_at: null,
          },
          select: { id: true },
        },
      );
    if (activeConnection !== null) {
      await props.acceptor.reject(
        1008,
        "Session already has an active connection",
      );
      return;
    }

    const connection: IEntity =
      await AutoBePlaygroundSessionConnectionProvider.open({
        session,
        acceptor: props.acceptor,
      });
    await AutoBePlaygroundSessionSocketAcceptor.connect({
      session,
      connection,
      acceptor: props.acceptor,
    });
  };

  export const replay = async (props: {
    id: string;
    acceptor: WebSocketAcceptor<void, IAutoBeRpcService, IAutoBeRpcListener>;
  }): Promise<void> => {
    const session: IAutoBePlaygroundSession.ISummary = await findSession(props);
    await AutoBePlaygroundSessionSocketAcceptor.replay({
      session,
      connection:
        await AutoBePlaygroundGlobal.prisma.autobe_playground_session_connections.findFirstOrThrow(
          {
            where: {
              autobe_playground_session_id: session.id,
            },
            orderBy: {
              created_at: "desc",
            },
          },
        ),
      acceptor: props.acceptor,
    });
  };

  const findSession = async (props: {
    id: string;
    acceptor: WebSocketAcceptor<void, IAutoBeRpcService, IAutoBeRpcListener>;
  }): Promise<IAutoBePlaygroundSession.ISummary> => {
    try {
      const record = await AutoBePlaygroundSessionProvider.find({
        id: props.id,
        payload: AutoBePlaygroundSessionProvider.summarize.select(),
      });
      return AutoBePlaygroundSessionProvider.summarize.transform(record);
    } catch (error) {
      await props.acceptor.reject(1008, "Session not found");
      throw error;
    }
  };
}
