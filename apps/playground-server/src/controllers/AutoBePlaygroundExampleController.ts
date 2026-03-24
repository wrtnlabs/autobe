import {
  IAutoBePlaygroundBenchmark,
  IAutoBePlaygroundReplay,
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
   * Returns vendor-grouped benchmark data sourced from the pre-computed
   * `benchmark.json`. Each entry contains a vendor identifier, emoji, score,
   * and its replay summaries.
   *
   * @author Samchon
   * @returns List of benchmarks grouped by vendor
   * @tag Example
   */
  @TypedRoute.Get()
  public async index(): Promise<IAutoBePlaygroundBenchmark[]> {
    return AutoBePlaygroundExampleProvider.index();
  }

  /**
   * Replay example data directly via WebSocket.
   *
   * Streams pre-recorded events from the benchmark example storage without
   * creating a database-backed session. Useful for quick preview and QA.
   *
   * @author Samchon
   * @param acceptor WebSocket acceptor
   * @param query Vendor and project identifiers
   * @tag Example
   */
  @WebSocketRoute("replay")
  public async replay(
    @WebSocketRoute.Acceptor()
    acceptor: WebSocketAcceptor<any, IAutoBeRpcService, IAutoBeRpcListener>,
    @WebSocketRoute.Query() query: IAutoBePlaygroundReplay.IQuery,
  ): Promise<void> {
    try {
      await AutoBePlaygroundExampleSocketProvider.replay({
        vendor: query.vendor,
        project: query.project,
        delay: query.delay,
        acceptor,
      });
    } catch {}
  }
}
