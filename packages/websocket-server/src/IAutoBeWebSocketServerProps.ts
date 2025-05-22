import { AutoBeAgent } from "@autobe/agent";
import { IAutoBeRpcListener, IAutoBeRpcService } from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import { WebSocketAcceptor } from "tgrid";

export interface IAutoBeWebSocketServerProps<Model extends ILlmSchema.Model> {
  agent(
    acceptor: WebSocketAcceptor<any, IAutoBeRpcService, IAutoBeRpcListener>,
  ): Promise<AutoBeAgent<Model> | null>;
}
