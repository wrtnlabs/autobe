import {
  IAutoBeRpcHeader,
  IAutoBeRpcListener,
  IAutoBeRpcService,
} from "@autobe/interface";
import { useEffect, useState } from "react";
import { WebSocketConnector } from "tgrid";

import { AutoBePlaygroundChatMovie } from "./movies/chat/AutoBePlaygroundChatMovie";
import { AutoBePlaygroundListener } from "./structures/AutoBePlaygroundListener";

export function AutoBePlaygroundReplayApplication() {
  const [next, setNext] = useState<AutoBePlaygroundChatMovie.IContext | null>(
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

      await connector.connect(getURL());
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
        <AutoBePlaygroundChatMovie
          title="AutoBE Playground (Replay)"
          {...next}
        />
      )}
    </div>
  );
}

const getURL = (): string => {
  const query: URLSearchParams = new URLSearchParams(window.location.search);
  const url: URL = new URL("ws://localhost:5890/mock");
  url.searchParams.set("vendor", query.get("vendor") ?? "openai/gpt-4.1");
  url.searchParams.set("schema", query.get("schema") ?? "chatgpt");
  url.searchParams.set("type", query.get("type") ?? "bbs-backend");
  return url.toString();
};
