import {
  IAutoBeHackathon,
  IAutoBeHackathonModerator,
  IAutoBeHackathonSession,
  IAutoBeRpcListener,
  IAutoBeRpcService,
  IPage,
} from "@autobe/interface";
import {
  TypedBody,
  TypedParam,
  TypedRoute,
  WebSocketRoute,
} from "@nestia/core";
import { Controller } from "@nestjs/common";
import { WebSocketAcceptor } from "tgrid";
import { tags } from "typia";

import { AutoBeHackathonModeratorAuth } from "../../decorators/AutoBeHackathonModeratorAuth";
import { AutoBeHackathonProvider } from "../../providers/AutoBeHackathonProvider";
import { AutoBeHackathonSessionProvider } from "../../providers/sessions/AutoBeHackathonSessionProvider";
import { AutoBeHackathonSessionSocketProvider } from "../../providers/sessions/AutoBeHackathonSessionSocketProvider";

@Controller("autobe/hackathon/:hackathonCode/moderators/sessions")
export class AutoBeHackathonModeratorSessionController {
  @TypedRoute.Patch()
  public async index(
    @AutoBeHackathonModeratorAuth() _moderator: IAutoBeHackathonModerator,
    @TypedParam("hackathonCode") hackathonCode: string,
    @TypedBody() body: IPage.IRequest,
  ): Promise<IPage<IAutoBeHackathonSession.ISummary>> {
    const hackathon: IAutoBeHackathon =
      await AutoBeHackathonProvider.get(hackathonCode);
    return await AutoBeHackathonSessionProvider.index({
      hackathon,
      participant: null,
      body,
    });
  }

  @TypedRoute.Get(":id")
  public async at(
    @AutoBeHackathonModeratorAuth() _moderator: IAutoBeHackathonModerator,
    @TypedParam("hackathonCode") hackathonCode: string,
    @TypedParam("id") id: string & tags.Format<"uuid">,
  ): Promise<IAutoBeHackathonSession> {
    const hackathon: IAutoBeHackathon =
      await AutoBeHackathonProvider.get(hackathonCode);
    return await AutoBeHackathonSessionProvider.at({
      hackathon,
      participant: null,
      id,
    });
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
        type: "moderator",
        hackathonCode,
        id,
        acceptor,
      });
    } catch {}
  }
}
