import { ExtensionContext, Uri, Webview, WebviewView } from "vscode";

import { Logger } from "../Logger";
import { getNonce } from "../util/crypto";
import { AutoBeWrapper } from "./autobe";

const WebviewPointer = {
  v: undefined as WebviewView | undefined,
};

export const getWebviewView = () => WebviewPointer.v;
const setWebviewView = (v: WebviewView) => {
  WebviewPointer.v = v;
};

export const getAutoBeWebviewProvider = (context: ExtensionContext) => {
  return {
    async resolveWebviewView(panel: WebviewView) {
      setWebviewView(panel);
      const instance = new AutoBeWrapper(panel.webview, context);
      await instance.initialize();

      panel.webview.options = { enableScripts: true };
      panel.webview.html = getHtmlContent(context)(panel.webview);
      panel.webview.onDidReceiveMessage(async (message) => {
        Logger.debug(
          `[AutoBe] onDidReceiveMessage: ${JSON.stringify(message)}`,
        );
        await instance.handlePostMessage(message);
      });
      panel.onDidDispose(async () => {
        await instance.dispose();
      });
    },
  };
};

const getUri =
  (webview: Webview, context: ExtensionContext) =>
  (...pathList: string[]) =>
    webview.asWebviewUri(Uri.joinPath(context.extensionUri, ...pathList));

export const getHtmlContent =
  (context: ExtensionContext) =>
  (webview: Webview): string => {
    const stylesUri = getUri(webview, context)(
      "webview-ui",
      "build",
      "assets",
      "index.css",
    );
    const scriptUri = getUri(webview, context)(
      "webview-ui",
      "build",
      "assets",
      "index.js",
    );

    const nonce = getNonce();
    return `
<!DOCTYPE html>
<html lang="en" style="height: 100%;">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no">
    <meta name="theme-color" content="#000000">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src ${webview.cspSource} data:; style-src ${webview.cspSource} 'unsafe-inline'; img-src ${webview.cspSource} https://storage.googleapis.com https://img.clerk.com data:; media-src ${webview.cspSource}; script-src ${webview.cspSource} 'wasm-unsafe-eval' 'nonce-${nonce}' https://us-assets.i.posthog.com 'strict-dynamic'; connect-src ${webview.cspSource} https://openrouter.ai https://api.requesty.ai https://us.i.posthog.com https://us-assets.i.posthog.com;">
    <link rel="stylesheet" type="text/css" href="${stylesUri}">
    <script nonce="${nonce}"></script>
    <title>Auto BE</title>
  </head>
  <body style="height: 100%;">
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root" style="height: 100%;"></div>
    <script nonce="${nonce}" type="module" src="${scriptUri}"></script>
  </body>
</html>
  `;
  };
