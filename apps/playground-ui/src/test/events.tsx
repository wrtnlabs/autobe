import {
  IAutoBeRpcHeader,
  IAutoBeRpcListener,
  IAutoBeRpcService,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import { createRoot } from "react-dom/client";
import { WebSocketConnector } from "tgrid";

import { AutoBePlaygroundChatMovie } from "../movies/chat/AutoBePlaygroundChatMovie";
import events from "../raw/shopping-backend-events.json";
import { AutoBePlaygroundListener } from "../structures/AutoBePlaygroundListener";

const main = async () => {
  const header: IAutoBeRpcHeader<ILlmSchema.Model> = {
    model: "chatgpt",
    vendor: {
      model: "gpt-4.1",
      apiKey: "",
    },
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    locale: "en-US",
  };
  const listener: AutoBePlaygroundListener = new AutoBePlaygroundListener();
  const connector: WebSocketConnector<
    IAutoBeRpcHeader<ILlmSchema.Model>,
    IAutoBeRpcListener,
    IAutoBeRpcService
  > = new WebSocketConnector(header, listener.getListener());
  await connector.connect("ws://localhost:443");

  createRoot(window.document.getElementById("root")!).render(
    <div
      style={{
        width: "100%",
        height: "100%",
      }}
    >
      <AutoBePlaygroundChatMovie
        header={header}
        listener={listener}
        service={connector.getDriver()}
        eventGroups={events as any}
      />
    </div>,
  );
};
main().catch(console.error);
