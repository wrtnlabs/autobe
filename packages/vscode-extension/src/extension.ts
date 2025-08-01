// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

import { Logger } from "./Logger";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  Logger.initialize(vscode.window.createOutputChannel("AutoBe"));
  Logger.info("AutoBe VSCode Extension start activated");

  // 웹뷰 제공자 등록
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("autobe-vscode-extension-views", {
      resolveWebviewView(webviewView: vscode.WebviewView) {
        webviewView.webview.options = { enableScripts: true };
        webviewView.webview.html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>My Webview</title>
          <style>
            body { padding: 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; }
            h1 { font-size: 18px; margin-bottom: 10px; }
            button { padding: 8px 16px; cursor: pointer; background: #0078d4; color: white; border: none; border-radius: 4px; }
            button:hover { background: #005a9e; }
          </style>
        </head>
        <body>
          <h1>My Sidebar Webview</h1>
          <p>Welcome to my custom webview!</p>
          <button onclick="alert('Button clicked!')">Click Me</button>
        </body>
        </html>
      `;
      },
    }),
  );
  Logger.info("AutoBe VSCode Extension end activated");
}
class MyTreeDataProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
    if (!element) {
      // 루트 노드
      return Promise.resolve([
        new vscode.TreeItem("Item 1", vscode.TreeItemCollapsibleState.None),
        new vscode.TreeItem("Item 2", vscode.TreeItemCollapsibleState.None),
      ]);
    }
    return Promise.resolve([]); // 하위 항목 없음
  }
}
// This method is called when your extension is deactivated
export function deactivate() {}
