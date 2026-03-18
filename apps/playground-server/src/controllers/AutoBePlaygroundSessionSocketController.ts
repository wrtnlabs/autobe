import { IAutoBeRpcListener, IAutoBeRpcService } from "@autobe/interface";
import { WebSocketRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import { WebSocketAcceptor } from "tgrid";
import { tags } from "typia";

import { AutoBePlaygroundSessionSocketProvider } from "../providers/sessions/AutoBePlaygroundSessionSocketProvider";

@Controller("autobe/playground/sessions")
export class AutoBePlaygroundSessionSocketController {
  /**
   * Connect to a session via WebSocket for real-time vibe coding.
   *
   * Establishes a bidirectional RPC connection to the AI agent. A new
   * connection record is created and the agent begins processing user
   * instructions. Events and histories are persisted to the database in real
   * time.
   *
   * @author Samchon
   * @param acceptor WebSocket acceptor
   * @param id Target session's {@link IAutoBePlaygroundSession.id}
   * @tag Session
   */
  @WebSocketRoute(":id/connect")
  public async connect(
    @WebSocketRoute.Acceptor()
    acceptor: WebSocketAcceptor<any, IAutoBeRpcService, IAutoBeRpcListener>,
    @WebSocketRoute.Param("id") id: string & tags.Format<"uuid">,
  ): Promise<void> {
    try {
      await AutoBePlaygroundSessionSocketProvider.connect({ id, acceptor });
    } catch {}
  }

  /**
   * Replay a completed session via WebSocket.
   *
   * Re-streams all previously recorded events from the session, allowing the
   * client to reconstruct the full session state. The replayed connection is
   * read-only; user input is disabled.
   *
   * @author Samchon
   * @param acceptor WebSocket acceptor
   * @param id Target session's {@link IAutoBePlaygroundSession.id}
   * @tag Session
   */
  @WebSocketRoute(":id/replay")
  public async replay(
    @WebSocketRoute.Acceptor()
    acceptor: WebSocketAcceptor<any, IAutoBeRpcService, IAutoBeRpcListener>,
    @WebSocketRoute.Param("id") id: string & tags.Format<"uuid">,
  ): Promise<void> {
    try {
      await AutoBePlaygroundSessionSocketProvider.replay({ id, acceptor });
    } catch {}
  }
}
