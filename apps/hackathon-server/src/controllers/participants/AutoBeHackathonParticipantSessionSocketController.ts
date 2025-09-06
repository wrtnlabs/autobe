import { IAutoBeHackathonSession } from "@autobe/hackathon-api";
import { IAutoBeRpcListener, IAutoBeRpcService } from "@autobe/interface";
import { WebSocketRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import { WebSocketAcceptor } from "tgrid";
import { tags } from "typia";

import { AutoBeHackathonSessionSocketProvider } from "../../providers/AutoBeHackathonSessionSocketProvider";

@Controller("autobe/hackathon/:hackathonCode/participants/sessions")
export class AutoBeHackathonParticipantSessionSocketController {
  @WebSocketRoute("start")
  public async start(
    @WebSocketRoute.Acceptor()
    acceptor: WebSocketAcceptor<
      IAutoBeHackathonSession.IStartHeader,
      IAutoBeRpcService,
      IAutoBeRpcListener
    >,
    @WebSocketRoute.Param("hackathonCode") hackathonCode: string,
  ): Promise<void> {
    try {
      await AutoBeHackathonSessionSocketProvider.start({
        hackathonCode,
        acceptor,
      });
    } catch {}
  }

  @WebSocketRoute(":id/restart")
  public async restart(
    @WebSocketRoute.Acceptor()
    acceptor: WebSocketAcceptor<
      IAutoBeHackathonSession.IRestartHeader,
      IAutoBeRpcService,
      IAutoBeRpcListener
    >,
    @WebSocketRoute.Param("hackathonCode") hackathonCode: string,
    @WebSocketRoute.Param("id") id: string & tags.Format<"uuid">,
  ): Promise<void> {
    try {
      await AutoBeHackathonSessionSocketProvider.restart({
        hackathonCode,
        id,
        acceptor,
      });
    } catch {}
  }

  @WebSocketRoute(":id/replay")
  public async replay(
    @WebSocketRoute.Acceptor()
    acceptor: WebSocketAcceptor<
      IAutoBeHackathonSession.IReplayHeader,
      IAutoBeRpcService,
      IAutoBeRpcListener
    >,
    @WebSocketRoute.Param("hackathonCode") hackathonCode: string,
    @WebSocketRoute.Param("id") id: string & tags.Format<"uuid">,
  ): Promise<void> {
    try {
      await AutoBeHackathonSessionSocketProvider.replay({
        hackathonCode,
        id,
        acceptor,
      });
    } catch {}
  }
}
