import {
  IAutoBePlaygroundReplay,
  IAutoBeRpcListener,
  IAutoBeRpcService,
} from "@autobe/interface";
import { TypedRoute, WebSocketRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import { WebSocketAcceptor } from "tgrid";

import { AutoBePlaygroundReplayProvider } from "../providers/AutoBePlaygroundReplayProvider";

@Controller("autobe/playground/replay")
export class AutoBePlaygroundReplayController {
  @TypedRoute.Get()
  public index(): Promise<IAutoBePlaygroundReplay.ISummary[]> {
    return AutoBePlaygroundReplayProvider.index();
  }

  @WebSocketRoute("get")
  public async get(
    @WebSocketRoute.Acceptor()
    acceptor: WebSocketAcceptor<
      undefined,
      IAutoBeRpcService,
      IAutoBeRpcListener
    >,
    @WebSocketRoute.Query() query: IAutoBePlaygroundReplay.IProps,
  ): Promise<void> {
    await AutoBePlaygroundReplayProvider.get(acceptor, query);
  }
}
