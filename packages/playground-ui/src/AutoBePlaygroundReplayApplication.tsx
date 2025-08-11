import {
  IAutoBeRpcHeader,
  IAutoBeRpcListener,
  IAutoBeRpcService,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
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
      const config: IConfig = getConfig();
      const header: IAutoBeRpcHeader<"chatgpt"> = {
        model: config.schema as "chatgpt",
        vendor: {
          model: config.vendor,
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

interface IConfig {
  vendor: string;
  schema: ILlmSchema.Model;
  type: string;
}

const getConfig = (): IConfig => {
  const query: URLSearchParams = new URLSearchParams(window.location.search);
  return {
    vendor: query.get("vendor") ?? "openai/gpt-4.1",
    schema: (query.get("schema") ?? "chatgpt") as ILlmSchema.Model,
    type: query.get("type") ?? "bbs-backend",
  };
};

const getURL = (): string => {
  const url: URL = new URL("ws://localhost:5890/mock");
  const query: URLSearchParams = new URLSearchParams(window.location.search);
  return `${url.toString()}?${query.toString()}`;
};
