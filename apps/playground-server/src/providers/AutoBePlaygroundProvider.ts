import { AutoBeAgent } from "@autobe/agent";
import {
  IAutoBeRpcHeader,
  IAutoBeRpcListener,
  IAutoBeRpcService,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import OpenAI from "openai";
import { WebSocketAcceptor } from "tgrid";

import { AutoBePlaygroundAcceptorProvider } from "./AutoBePlaygroundAcceptorProvider";

export namespace AutoBePlaygroundProvider {
  export const start = async (
    acceptor: WebSocketAcceptor<
      IAutoBeRpcHeader<ILlmSchema.Model>,
      IAutoBeRpcService,
      IAutoBeRpcListener
    >,
  ): Promise<void> => {
    await AutoBePlaygroundAcceptorProvider.accept(
      acceptor,
      (compiler) =>
        new AutoBeAgent({
          model: acceptor.header.model,
          vendor: {
            api: new OpenAI({
              apiKey: acceptor.header.vendor.apiKey,
              baseURL: acceptor.header.vendor.baseURL,
            }),
            model: acceptor.header.vendor.model,
            semaphore: acceptor.header.vendor.semaphore,
          },
          config: {
            locale: acceptor.header.locale,
            timezone: acceptor.header.timezone,
          },
          compiler: () => compiler,
        }),
    );
  };
}
