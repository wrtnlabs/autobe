import {
  IAutoBePlaygroundExample,
  IAutoBeRpcListener,
  IAutoBeRpcService,
} from "@autobe/interface";
import { TypedRoute, WebSocketRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import { WebSocketAcceptor } from "tgrid";

import { AutoBePlaygroundExampleProvider } from "../providers/examples/AutoBePlaygroundExampleProvider";
import { AutoBePlaygroundExampleSocketProvider } from "../providers/examples/AutoBePlaygroundExampleSocketProvider";

@Controller("autobe/playground/examples")
export class AutoBePlaygroundExampleController {
  /**
   * List all available examples from benchmark storage.
   *
   * Returns vendor/project/phase combinations that have pre-recorded data
   * available for mock session creation and direct replay.
   *
   * @author Samchon
   * @returns List of available examples
   * @tag Example
   */
  @TypedRoute.Get()
  public async index(): Promise<IAutoBePlaygroundExample[]> {
    return AutoBePlaygroundExampleProvider.index();
  }

  /**
   * Replay example data directly via WebSocket.
   *
   * Streams pre-recorded events from the benchmark example storage without
   * creating a database-backed session. Useful for quick preview and QA.
   *
   * The vendor slug is split across two path params (`provider` and `model`)
   * to avoid URL encoding issues with slashes (e.g. "openai" + "gpt-4.1").
   *
   * @author Samchon
   * @param acceptor WebSocket acceptor
   * @param provider Vendor provider name (e.g. "openai")
   * @param model Model name (e.g. "gpt-4.1")
   * @param project Example project name (e.g. "bbs")
   * @tag Example
   */
  @WebSocketRoute(":provider/:model/:project/replay")
  public async replay(
    @WebSocketRoute.Acceptor()
    acceptor: WebSocketAcceptor<any, IAutoBeRpcService, IAutoBeRpcListener>,
    @WebSocketRoute.Param("provider") provider: string,
    @WebSocketRoute.Param("model") model: string,
    @WebSocketRoute.Param("project") project: string,
  ): Promise<void> {
    try {
      await AutoBePlaygroundExampleSocketProvider.replay({
        vendor: `${provider}/${model}`,
        project,
        acceptor,
      });
    } catch {}
  }
}
