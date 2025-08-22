import { AutoBeAgent } from "@autobe/agent";
import {
  IAutoBePlaygroundHeader,
  IAutoBeRpcListener,
  IAutoBeRpcService,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import OpenAI from "openai";
import { WebSocketAcceptor } from "tgrid";

import { AutoBePlaygroundAcceptor } from "./AutoBePlaygroundAcceptor";

export namespace AutoBePlaygroundProvider {
  export const start = async (
    acceptor: WebSocketAcceptor<
      IAutoBePlaygroundHeader<ILlmSchema.Model>,
      IAutoBeRpcService,
      IAutoBeRpcListener
    >,
  ): Promise<void> => {
    await AutoBePlaygroundAcceptor.accept({
      prefix: `${acceptor.header.vendor.model}/chat`,
      acceptor,
      agent: (compiler) =>
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
    });
  };
}
