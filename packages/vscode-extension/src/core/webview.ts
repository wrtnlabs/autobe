import { AutoBeTokenUsage } from "@autobe/agent";
import {
  AutoBeEvent,
  AutoBeHistory,
  IAutoBeRpcListener,
  IAutoBeRpcService,
  IAutoBeTokenUsageJson,
} from "@autobe/interface";
import {
  IAutoBeWebviewMessage,
  IResponseGetConfig,
} from "@autobe/vscode-extension/interface";
import { WorkerConnector } from "tgrid";
import typia from "typia";
import { ExtensionContext, Uri, Webview, WebviewView } from "vscode";

import { Logger } from "../Logger";
import {
  AUTOBE_API_KEY,
  AUTOBE_CHAT_SESSION_MAP,
  AUTOBE_CONFIG,
} from "../constant/key";
import { getNonce } from "../util/crypto";

export const getAutoBeWebviewProvider = (context: ExtensionContext) => {
  return {
    async resolveWebviewView(panel: WebviewView) {
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
    },
  };
};

export const getHtmlContent =
  (context: ExtensionContext) =>
  (webview: Webview): string => {
    const getUri = (...pathList: string[]) =>
      webview.asWebviewUri(Uri.joinPath(context.extensionUri, ...pathList));

    const stylesUri = getUri("webview-ui", "build", "assets", "index.css");
    const scriptUri = getUri("webview-ui", "build", "assets", "index.js");

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

type RpcHeader = {
  apiKey: string;
  model: string;
  baseUrl: string;
  concurrencyRequest: number;
};

type AutoBeWorkerConnector = WorkerConnector<
  RpcHeader,
  IAutoBeRpcListener,
  IAutoBeRpcService
>;

type Session = {
  sessionId: string;
  history: Array<AutoBeHistory>;
  tokenUsage: IAutoBeTokenUsageJson;
  agent?: AutoBeWorkerConnector;
};

class AutoBeWrapper {
  private readonly webview: Webview;
  private readonly context: ExtensionContext;
  public config: IResponseGetConfig["data"] | undefined;

  private readonly chatSessionMap: Map<string, Session> = new Map();

  constructor(webview: Webview, context: ExtensionContext) {
    this.webview = webview;
    this.context = context;
  }

  public async initialize() {
    const chatSessionMap = await this.context.globalState.get(
      AUTOBE_CHAT_SESSION_MAP,
    );
    (chatSessionMap as Array<[string, Session]> | undefined)?.forEach(
      ([sessionId, session]) => {
        this.chatSessionMap.set(sessionId, session);
      },
    );
  }

  public async dispose() {
    await this.context.globalState.update(
      AUTOBE_CHAT_SESSION_MAP,
      Array.from(this.chatSessionMap.entries()),
    );
  }

  public async handlePostMessage(message: IAutoBeWebviewMessage) {
    switch (message.type) {
      case "req_get_api_key": {
        const apiKey = await this.context.secrets.get(AUTOBE_API_KEY);
        await this.webview.postMessage({
          type: "res_get_api_key",
          data: apiKey,
        });
        break;
      }
      case "req_set_config": {
        const { apiKey, ...restConfig } = message.data;

        if (apiKey !== undefined) {
          await this.context.secrets.store(AUTOBE_API_KEY, apiKey);
        }
        const existingConfig = (await this.context.globalState.get(
          AUTOBE_CONFIG,
        )) as Partial<IResponseGetConfig["data"]> | undefined;
        await this.context.globalState.update(AUTOBE_CONFIG, {
          ...existingConfig,
          ...restConfig,
        });
        break;
      }
      case "req_create_chat_session":
        const session = await this.createChatSession();
        await this.webview.postMessage({
          type: "res_create_chat_session",
          data: session.sessionId,
        });

        await this.conversate({
          session,
          message: message.data.message,
        });
        break;
    }
  }

  private async createChatSession() {
    const sessionId = "123123123";
    return {
      sessionId,
      history: [],
      tokenUsage: new AutoBeTokenUsage().toJSON(),
    };
  }

  private async conversate(props: { session: Session; message: string }) {
    const config = this.config;
    if (config?.apiKey === undefined) {
      throw new Error("Config is not initialized");
    }

    if (props.session.agent !== undefined) {
      const history = await props.session.agent
        .getDriver()
        .conversate(props.message);
      props.session.history.push(...history);
      return;
    }

    props.session.agent = new WorkerConnector(
      {
        apiKey: this.config?.apiKey ?? "",
        model: this.config?.model ?? "chatgpt",
        baseUrl: this.config?.baseUrl ?? "",
        concurrencyRequest: Number(this.config?.concurrencyRequest ?? "16"),
      },
      typia.misc.literals<keyof IAutoBeRpcListener>().reduce(
        (acc, cur) => ({
          ...acc,
          [cur]: async (message: AutoBeEvent) => {
            await this.webview.postMessage({
              type: "on_event_auto_be",
              data: message,
            });
            props.session.tokenUsage = await props.session
              .agent!.getDriver()
              .getTokenUsage();
            await this.webview.postMessage({
              type: "on_event_update_token_usage",
              data: props.session.tokenUsage,
            });
          },
        }),
        {} as IAutoBeRpcListener,
      ),
      "process",
    );

    const history = await props.session.agent
      .getDriver()
      .conversate(props.message);
    props.session.history.push(...history);
  }
}
