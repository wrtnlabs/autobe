import {
  IAutoBePlaygroundHeader,
  IAutoBeRpcListener,
  IAutoBeRpcService,
} from "@autobe/interface";
import {
  AutoBeListener,
  AutoBeServiceFactory,
  IAutoBeConfig,
  IAutoBeServiceData,
} from "@autobe/ui";
import { IAutoBeWebviewMessage } from "@autobe/vscode-extension/interface";
import { useEffect, useState } from "react";

import { useAutoBeService } from "./use-autobe-service";
import useVsCode from "./use-vscode";

export const useServiceFactory = (): AutoBeServiceFactory => {
  const vscode = useVsCode();
  const [listener] = useState<AutoBeListener>(new AutoBeListener());
  const [, setError] = useState<Error | null>(null);
  const [header, setHeader] = useState<IAutoBePlaygroundHeader | null>(null);

  const service = useAutoBeService();

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

  return async (): Promise<IAutoBeServiceData> => {
    return {
      sessionId: "",
      service: service,
      listener: listener,
      close: () => {},
    };
  };
};
