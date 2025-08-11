import { useEffect, useState } from "react";
import type { WebviewApi } from "vscode-webview";

const useVsCode = () => {
  const [vscode, setVsCode] = useState<WebviewApi<unknown> | null>(null);

  useEffect(() => {
    setVsCode(acquireVsCodeApi());
  }, []);

  return vscode;
};

export default useVsCode;
