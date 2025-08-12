import { ExtensionContext, commands } from "vscode";

import { getWebviewView } from "../core/webview";

export const registerCommands = (props: { context: ExtensionContext }) => {
  const { context } = props;

  const commandList = Object.entries(COMMAND_CONFIG_MAP).map(([key, value]) =>
    commands.registerCommand(`autobe.${key}`, value),
  );
  context.subscriptions.push(...commandList);
};

const COMMAND_CONFIG_MAP = {
  configButtonClicked: async () => {
    const webviewView = getWebviewView();
    if (webviewView === undefined) {
      return;
    }

    await webviewView.webview.postMessage({
      type: "action_to_config",
    });
  },
};
