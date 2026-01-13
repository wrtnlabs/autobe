import { IAutoBePlaygroundHeader, IAutoBeRpcListener } from "@autobe/interface";
import { AutoBeChatMain, AutoBeListener } from "@autobe/ui";
import { IAutoBeWebviewMessage } from "@autobe/vscode-extension/interface";
import { useEffect, useState } from "react";

import useVsCode from "../hooks/use-vscode";

const Chat = () => {
  const vscode = useVsCode();
  const [listener] = useState<AutoBeListener>(new AutoBeListener());
  const [, setError] = useState<Error | null>(null);
  const [header, setHeader] = useState<IAutoBePlaygroundHeader | null>(null);

  useEffect(() => {
    const defaultEventListenFn = (message: IAutoBeWebviewMessage) => {
      switch (message.type) {
        case "on_event_auto_be": {
          const fn =
            listener.getListener()[
              message.data.type as keyof IAutoBeRpcListener
            ];
          if (fn) {
            fn(message.data as any);
          }
          return;
        }
        case "res_get_config":
          setHeader({
            vendor: {
              model: message.data.model,
              apiKey: message.data.apiKey ?? "",
              baseURL: message.data.baseUrl ?? "",
              semaphore: message.data.concurrencyRequest ?? 16,
            },
            timezone: message.data.timezone ?? "en-US",
            locale: message.data.locale ?? "en-US",
          });
          break;
      }
    };
    vscode.onMessage(defaultEventListenFn);
    return () => {
      vscode.offMessage(defaultEventListenFn);
    };
  }, [vscode]);

  if (header === null) {
    vscode.postMessage({
      type: "req_get_config",
    });
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* 채팅 영역 */}
      <div className="flex-1 overflow-hidden h-full mx-1">
        <AutoBeChatMain
          isMobile={true}
          setError={setError}
          className="h-full"
        />
      </div>
    </div>
  );
};

export default Chat;
