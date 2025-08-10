// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { ExtensionContext, window } from "vscode";

import { Logger } from "./Logger";
import { getAutoBeWebviewProvider } from "./core/webview";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: ExtensionContext) {
  Logger.initialize(window.createOutputChannel("AutoBe"));
  Logger.info("AutoBe VSCode Extension start activated");

  Logger.info(
    `AutoBe VSCode Extension ${context.extensionUri}, ${context.extensionPath}`,
  );

  context.subscriptions.push(
    window.registerWebviewViewProvider(
      "autobe-vscode-extension-views",
      getAutoBeWebviewProvider(context),
    ),
  );
  Logger.info("AutoBe VSCode Extension end activated");
}

// This method is called when your extension is deactivated
export function deactivate() {}
