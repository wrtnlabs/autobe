import { IAutoBeRpcListener, IAutoBeRpcService } from "@autobe/interface";
import { WebSocketAcceptor } from "tgrid";
import { v7 } from "uuid";

import { AutoBeHackathonGlobal } from "../AutoBeHackathonGlobal";
import { IEntity } from "../structures/IEntity";

export namespace AutoBeHackathonSessionConnectionProvider {
  export const emplace = async (props: {
    session: IEntity;
    acceptor: WebSocketAcceptor<unknown, IAutoBeRpcService, IAutoBeRpcListener>;
  }): Promise<IEntity> => {
    const connection =
      await AutoBeHackathonGlobal.prisma.autobe_hackathon_session_connections.create(
        {
          data: {
            id: v7(),
            autobe_hackathon_session_id: props.session.id,
            created_at: new Date(),
            disconnected_at: null,
          },
        },
      );
    return connection;
  };

  export const disconnect = async (id: string): Promise<void> => {
    await AutoBeHackathonGlobal.prisma.autobe_hackathon_session_connections.update(
      {
        where: { id },
        data: {
          disconnected_at: new Date(),
        },
      },
    );
  };
}
