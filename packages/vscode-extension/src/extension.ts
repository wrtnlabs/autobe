// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

import { Logger } from "./Logger";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  Logger.initialize(vscode.window.createOutputChannel("AutoBe"));
  Logger.info("AutoBe VSCode Extension start activated");
  const treeDataProvider = new MyTreeDataProvider();
  vscode.window.registerTreeDataProvider(
    "autobe-vscode-extension-views",
    treeDataProvider,
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
