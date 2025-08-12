import { IAutoBeWebviewMessage } from "@autobe/vscode-extension/interface";
import { useEffect, useRef, useState } from "react";
import type { WebviewApi } from "vscode-webview";

const useVsCode = () => {
  const [vscode, setVsCode] = useState<WebviewApi<unknown> | null>(null);
  const handlerRef = useRef<((message: IAutoBeWebviewMessage) => void) | null>(
    null,
  );

  useEffect(() => {
    setVsCode(acquireVsCodeApi());

    const onMessage = (event: MessageEvent) => {
      const message = event.data as IAutoBeWebviewMessage;
      handlerRef.current?.(message);
    };

    window.addEventListener("message", onMessage);

    return () => {
      window.removeEventListener("message", onMessage);
    };
  }, []);

  const onMessage = (fn: (message: IAutoBeWebviewMessage) => void) => {
    handlerRef.current = fn;
  };

  return {
    getState: vscode?.getState,
    setState: vscode?.setState,
    postMessage: (message: IAutoBeWebviewMessage) => {
      vscode?.postMessage(message);
    },
    onMessage,
  };
};

export default useVsCode;
