import { IAutoBeWebviewMessage } from "@autobe/vscode-extension/interface";
import { useEffect, useRef } from "react";
import type { WebviewApi } from "vscode-webview";

const vscodePointer: { v: null | WebviewApi<unknown> } = { v: null };
const useVsCode = () => {
  const handlerRef = useRef<Set<(message: IAutoBeWebviewMessage) => void>>(
    new Set(),
  );

  if (vscodePointer.v === null) {
    vscodePointer.v = acquireVsCodeApi();
  }
  const vscode = vscodePointer.v;

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const message = event.data as IAutoBeWebviewMessage;
      handlerRef.current?.forEach((fn) => fn(message));
    };

    window.addEventListener("message", onMessage);

    return () => {
      window.removeEventListener("message", onMessage);
    };
  }, []);

  const onMessage = (fn: (message: IAutoBeWebviewMessage) => void) => {
    handlerRef.current?.add(fn);
  };

  const offMessage = (fn: (message: IAutoBeWebviewMessage) => void) => {
    handlerRef.current?.delete(fn);
  };

  return {
    getState: vscode?.getState,
    setState: vscode?.setState,
    postMessage: (message: IAutoBeWebviewMessage) => {
      vscode?.postMessage(message);
    },
    onMessage,
    offMessage,
  };
};

export default useVsCode;
