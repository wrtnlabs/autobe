import { IAutoBeRpcListener, IAutoBeRpcService } from "@autobe/interface";
import { WebSocketAcceptor } from "tgrid";
import { v7 } from "uuid";

import { AutoBePlaygroundGlobal } from "../../AutoBePlaygroundGlobal";
import { IEntity } from "../../structures/IEntity";

export namespace AutoBePlaygroundSessionConnectionProvider {
  export const open = async (props: {
    session: IEntity;
    acceptor: WebSocketAcceptor<unknown, IAutoBeRpcService, IAutoBeRpcListener>;
  }): Promise<IEntity> => {
    const connection =
      await AutoBePlaygroundGlobal.prisma.autobe_playground_session_connections.create(
        {
          data: {
            id: v7(),
            autobe_playground_session_id: props.session.id,
            created_at: new Date(),
            disconnected_at: null,
          },
        },
      );
    return connection;
  };

  export const close = async (id: string): Promise<void> => {
    await AutoBePlaygroundGlobal.prisma.autobe_playground_session_connections.update(
      {
        where: { id },
        data: { disconnected_at: new Date() },
      },
    );
  };
}
