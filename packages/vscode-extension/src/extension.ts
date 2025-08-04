// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

import { Logger } from "./Logger";
import { getHtmlContent } from "./core/webview";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  Logger.initialize(vscode.window.createOutputChannel("AutoBe"));
  Logger.info("AutoBe VSCode Extension start activated");

  Logger.info(
    `AutoBe VSCode Extension ${context.extensionUri}, ${context.extensionPath}`,
  );
  // 웹뷰 제공자 등록
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("autobe-vscode-extension-views", {
      resolveWebviewView(webviewView: vscode.WebviewView) {
        webviewView.webview.options = { enableScripts: true };
        webviewView.webview.html = getHtmlContent(context)(webviewView.webview);
      },
    }),
  );
  Logger.info("AutoBe VSCode Extension end activated");
}

// This method is called when your extension is deactivated
export function deactivate() {}
