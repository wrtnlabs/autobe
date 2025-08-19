import { IAutoBeWebviewMessage } from "@autobe/vscode-extension/interface";
import { useEffect, useRef, useState } from "react";
import type { WebviewApi } from "vscode-webview";

const vscodePointer: { v: null | WebviewApi<unknown> } = { v: null };
const useVsCode = () => {
  const handlerRef = useRef<((message: IAutoBeWebviewMessage) => void) | null>(
    null,
  );

  if (vscodePointer.v === null) {
    vscodePointer.v = acquireVsCodeApi();
  }
  const vscode = vscodePointer.v;

  useEffect(() => {
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
