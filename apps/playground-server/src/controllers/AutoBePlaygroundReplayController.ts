import { IAutoBeRpcListener, IAutoBeRpcService } from "@autobe/interface";
import { IAutoBePlaygroundReplay, IPage } from "@autobe/playground-sdk";
import { TypedBody, TypedRoute, WebSocketRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import { WebSocketAcceptor } from "tgrid";

import { AutoBePlaygroundReplayProvider } from "../providers/AutoBePlaygroundReplayProvider";

@Controller("autobe/playground/replay")
export class AutoBePlaygroundReplayController {
  @TypedRoute.Patch()
  public index(
    @TypedBody() input: IAutoBePlaygroundReplay.IRequest,
  ): Promise<IPage<IAutoBePlaygroundReplay>> {
    return AutoBePlaygroundReplayProvider.index(input);
  }

  @WebSocketRoute("get")
  public async get(
    @WebSocketRoute.Query() props: IAutoBePlaygroundReplay,
    @WebSocketRoute.Acceptor()
    acceptor: WebSocketAcceptor<null, IAutoBeRpcService, IAutoBeRpcListener>,
  ): Promise<void> {
    await AutoBePlaygroundReplayProvider.get(props, acceptor);
  }
}
