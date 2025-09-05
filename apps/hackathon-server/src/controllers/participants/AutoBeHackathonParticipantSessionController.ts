import {
  IAutoBeHackathonSession,
  IAutobeHackathon,
  IAutobeHackathonParticipant,
  IPage,
} from "@autobe/hackathon-api";
import { IAutoBeRpcListener, IAutoBeRpcService } from "@autobe/interface";
import {
  TypedBody,
  TypedParam,
  TypedRoute,
  WebSocketRoute,
} from "@nestia/core";
import { Controller } from "@nestjs/common";
import { WebSocketAcceptor } from "tgrid";
import { tags } from "typia";

import { AutoBeHackathonParticipantAuth } from "../../decorators/AutoBeHackathonParticipantAuth";
import { AutoBeHackathonProvider } from "../../providers/AutoBeHackathonProvider";
import { AutoBeHackathonSessionProvider } from "../../providers/AutoBeHackathonSessionProvider";
import { AutoBeHackathonSessionSocketProvider } from "../../providers/AutoBeHackathonSessionSocketProvider";

@Controller("autobe/hackathon/:hackathonCode/participants/sessions")
export class AutoBeHackathonParticipantSessionController {
  /* -----------------------------------------------------------
    Restful API
  ----------------------------------------------------------- */
  @TypedRoute.Patch()
  public async index(
    @AutoBeHackathonParticipantAuth()
    participant: IAutobeHackathonParticipant,
    @TypedParam("hackathonCode") hackathonCode: string,
    @TypedBody() body: IPage.IRequest,
  ): Promise<IPage<IAutoBeHackathonSession.ISummary>> {
    const hackathon: IAutobeHackathon =
      await AutoBeHackathonProvider.get(hackathonCode);
    return await AutoBeHackathonSessionProvider.index({
      hackathon,
      participant,
      body,
    });
  }

  @TypedRoute.Get(":id")
  public async at(
    @AutoBeHackathonParticipantAuth()
    participant: IAutobeHackathonParticipant,
    @TypedParam("hackathonCode") hackathonCode: string,
    @TypedParam("id") id: string & tags.Format<"uuid">,
  ): Promise<IAutoBeHackathonSession> {
    const hackathon: IAutobeHackathon =
      await AutoBeHackathonProvider.get(hackathonCode);
    return await AutoBeHackathonSessionProvider.at({
      hackathon,
      participant,
      id,
    });
  }

  @TypedRoute.Put(":id/review")
  public async review(
    @AutoBeHackathonParticipantAuth()
    participant: IAutobeHackathonParticipant,
    @TypedParam("hackathonCode") hackathonCode: string,
    @TypedParam("id") id: string & tags.Format<"uuid">,
    @TypedBody() body: IAutoBeHackathonSession.IReview,
  ): Promise<void> {
    const hackathon: IAutobeHackathon =
      await AutoBeHackathonProvider.get(hackathonCode);
    await AutoBeHackathonSessionProvider.review({
      hackathon,
      participant,
      id,
      body,
    });
  }

  /* -----------------------------------------------------------
    WebSocket API
  ----------------------------------------------------------- */
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
