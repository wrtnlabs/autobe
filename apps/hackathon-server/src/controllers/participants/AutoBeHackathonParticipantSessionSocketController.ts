import {
  IAutoBeHackathonSession,
  IAutoBeRpcListener,
  IAutoBeRpcService,
} from "@autobe/interface";
import { WebSocketRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import { WebSocketAcceptor } from "tgrid";
import { tags } from "typia";

import { AutoBeHackathonSessionSocketProvider } from "../../providers/sessions/AutoBeHackathonSessionSocketProvider";

@Controller("autobe/hackathon/:hackathonCode/participants/sessions")
export class AutoBeHackathonParticipantSessionSocketController {
  @WebSocketRoute(":id/connect")
  public async connect(
    @WebSocketRoute.Acceptor()
    acceptor: WebSocketAcceptor<
      IAutoBeHackathonSession.IHeader,
      IAutoBeRpcService,
      IAutoBeRpcListener
    >,
    @WebSocketRoute.Param("hackathonCode") hackathonCode: string,
    @WebSocketRoute.Param("id") id: string & tags.Format<"uuid">,
    @WebSocketRoute.Query() query: IAutoBeHackathonSession.IQuery,
  ): Promise<void> {
    try {
      await AutoBeHackathonSessionSocketProvider.connect({
        hackathonCode,
        id,
        acceptor,
        query,
      });
    } catch {}
  }

  @WebSocketRoute(":id/replay")
  public async replay(
    @WebSocketRoute.Acceptor()
    acceptor: WebSocketAcceptor<
      IAutoBeHackathonSession.IHeader,
      IAutoBeRpcService,
      IAutoBeRpcListener
    >,
    @WebSocketRoute.Param("hackathonCode") hackathonCode: string,
    @WebSocketRoute.Param("id") id: string & tags.Format<"uuid">,
  ): Promise<void> {
    try {
      await AutoBeHackathonSessionSocketProvider.replay({
        type: "participant",
        hackathonCode,
        id,
        acceptor,
      });
    } catch {}
  }

  @WebSocketRoute(":id/simulate")
  public async simulate(
    @WebSocketRoute.Acceptor()
    acceptor: WebSocketAcceptor<
      IAutoBeHackathonSession.IHeader,
      IAutoBeRpcService,
      IAutoBeRpcListener
    >,
    @WebSocketRoute.Param("hackathonCode") hackathonCode: string,
    @WebSocketRoute.Param("id") id: string & tags.Format<"uuid">,
  ): Promise<void> {
    try {
      await AutoBeHackathonSessionSocketProvider.simulate({
        hackathonCode,
        id,
        acceptor,
      });
    } catch {}
  }
}
