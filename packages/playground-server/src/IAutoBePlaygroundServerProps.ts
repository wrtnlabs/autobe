import { IAutoBeRpcListener, IAutoBeRpcService } from "@autobe/interface";
import { WebSocketAcceptor } from "tgrid";

import { IAutoBePlaygroundPredicate } from "./IAutoBePlaygroundPredicate";

export interface IAutoBePlaygroundServerProps<Header extends object> {
  predicate(
    acceptor: WebSocketAcceptor<Header, IAutoBeRpcService, IAutoBeRpcListener>,
  ): Promise<IAutoBePlaygroundPredicate>;
}
