import { IAutoBePlaygroundHeader, IAutoBeRpcListener } from "@autobe/interface";
import {
  AutoBeListener,
  AutoBeServiceFactory,
  IAutoBeServiceData,
} from "@autobe/ui";
import { IAutoBeWebviewMessage } from "@autobe/vscode-extension/interface";
import { useEffect, useState } from "react";

import { useAutoBeService } from "./use-autobe-service";
import useVsCode from "./use-vscode";

export const useServiceFactory = (): AutoBeServiceFactory => {
  const vscode = useVsCode();
  const [listener] = useState<AutoBeListener>(new AutoBeListener());

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
