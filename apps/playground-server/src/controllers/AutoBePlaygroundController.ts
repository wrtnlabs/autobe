import {
  IAutoBePlaygroundHeader,
  IAutoBeRpcListener,
  IAutoBeRpcService,
} from "@autobe/interface";
import { WebSocketRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import { ILlmSchema } from "@samchon/openapi";
import { WebSocketAcceptor } from "tgrid";

import { AutoBePlaygroundProvider } from "../providers/AutoBePlaygroundProvider";

@Controller("autobe/playground")
export class AutoBePlaygroundController {
  @WebSocketRoute("start")
  public async start(
    @WebSocketRoute.Acceptor()
    acceptor: WebSocketAcceptor<
      IAutoBePlaygroundHeader<ILlmSchema.Model>,
      IAutoBeRpcService,
      IAutoBeRpcListener
    >,
  ): Promise<void> {
    await AutoBePlaygroundProvider.start(acceptor);
  }
}
