import * as vscode from "vscode";
import { Uri } from "vscode";

import { getNonce } from "../util/crypto";

export const getHtmlContent =
  (context: vscode.ExtensionContext) =>
  (webview: vscode.Webview): string => {
    const getUri = (...pathList: string[]) =>
      webview.asWebviewUri(Uri.joinPath(context.extensionUri, ...pathList));

    const stylesUri = getUri("webview-ui", "build", "assets", "index.css");
    const scriptUri = getUri("webview-ui", "build", "assets", "index.js");

    const nonce = getNonce();
    return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no">
    <meta name="theme-color" content="#000000">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src ${webview.cspSource} data:; style-src ${webview.cspSource} 'unsafe-inline'; img-src ${webview.cspSource} https://storage.googleapis.com https://img.clerk.com data:; media-src ${webview.cspSource}; script-src ${webview.cspSource} 'wasm-unsafe-eval' 'nonce-${nonce}' https://us-assets.i.posthog.com 'strict-dynamic'; connect-src ${webview.cspSource} https://openrouter.ai https://api.requesty.ai https://us.i.posthog.com https://us-assets.i.posthog.com;">
    <link rel="stylesheet" type="text/css" href="${stylesUri}">
    <script nonce="${nonce}"></script>
    <title>Auto BE</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
    <script nonce="${nonce}" type="module" src="${scriptUri}"></script>
  </body>
</html>
  `;
  };
