import { IAutoBeRpcListener, IAutoBeRpcService } from "@autobe/interface";
import { AutoBeRpcService } from "@autobe/rpc";
import { ILlmSchema } from "@samchon/openapi";
import { WebSocketServer } from "tgrid";

import { IAutoBeWebSocketServerProps } from "./IAutoBeWebSocketServerProps";

export class AutoBeWebSocketServer<Model extends ILlmSchema.Model> {
  private readonly server: WebSocketServer<
    any,
    IAutoBeRpcService,
    IAutoBeRpcListener
  >;

  public constructor(
    private readonly props: IAutoBeWebSocketServerProps<Model>,
  ) {
    this.server = new WebSocketServer();
  }

  public async open(port: number): Promise<void> {
    await this.server.open(port, async (acceptor) => {
      const agent = await this.props.agent(acceptor);
      if (agent === null) await acceptor.reject();
      else
        await acceptor.accept(
          new AutoBeRpcService({
            agent,
            listener: acceptor.getDriver(),
          }),
        );
    });
  }

  public async close(): Promise<void> {
    await this.server.close();
  }

  public get state() {
    return this.server.state;
  }
}
