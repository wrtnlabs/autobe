import {
  IAutoBeRpcHeader,
  IAutoBeRpcListener,
  IAutoBeRpcService,
} from "@autobe/interface";
import { useEffect, useState } from "react";
import { WebSocketConnector } from "tgrid";

import { AutoBePlaygroundChatMovie } from "./movies/chat/AutoBePlaygroundChatMovie";
import { AutoBePlaygroundListener } from "./structures/AutoBePlaygroundListener";

export function AutoBePlaygroundMockApplication() {
  const [next, setNext] = useState<AutoBePlaygroundChatMovie.IProps | null>(
    null,
  );
  useEffect(() => {
    const connect = async () => {
      const header: IAutoBeRpcHeader<"chatgpt"> = {
        model: "chatgpt",
        vendor: {
          model: "fake-model",
          apiKey: "*********",
        },
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: "en-US",
      };
      const listener: AutoBePlaygroundListener = new AutoBePlaygroundListener();
      const connector: WebSocketConnector<
        IAutoBeRpcHeader<"chatgpt">,
        IAutoBeRpcListener,
        IAutoBeRpcService
      > = new WebSocketConnector(header, listener.getListener());
      await connector.connect("ws://localhost:5890/mock");
      setNext({
        header,
        listener,
        service: connector.getDriver(),
      });
    };
    connect().catch(console.error);
  }, []);
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        overflow: next !== null ? undefined : "auto",
      }}
    >
      {next === null ? (
        <>Connecting...</>
      ) : (
        <AutoBePlaygroundChatMovie {...next} />
      )}
    </div>
  );
}
