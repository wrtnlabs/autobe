import { AutoBeAgent, IAutoBeProps } from "@autobe/agent";
import { AutoBeCompiler } from "@autobe/compiler";
import { AutoBeHistory, IAutoBeTokenUsageJson } from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import OpenAI from "openai";
import { ExtensionContext, Uri, Webview, WebviewView } from "vscode";

import {
  AUTOBE_API_KEY,
  AUTOBE_CHAT_SESSION_MAP,
  AUTOBE_CONFIG,
  AUTOBE_EVENT_TYPES,
} from "../constant/key";
import {
  IAutoBeWebviewMessage,
  IResponseGetConfig,
} from "../constant/message.dto";
import { getNonce } from "../util/crypto";

export const getAutoBeWebviewProvider = (context: ExtensionContext) => {
  return {
    async resolveWebviewView(panel: WebviewView) {
      const instance = new AutoBeWrapper(panel.webview, context);
      await instance.initialize();

      panel.webview.options = { enableScripts: true };
      panel.webview.html = getHtmlContent(context)(panel.webview);
      panel.webview.onDidReceiveMessage(async (message) => {
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

class AutoBeWrapper {
  private readonly webview: Webview;
  private readonly context: ExtensionContext;
  public config: IResponseGetConfig["data"] | undefined;

  private readonly chatSessionMap: Map<
    string,
    {
      history: Array<AutoBeHistory>;
      tokenUsage: IAutoBeTokenUsageJson;
    }
  > = new Map();

  constructor(webview: Webview, context: ExtensionContext) {
    this.webview = webview;
    this.context = context;
  }

  public async initialize() {
    const chatSessionMap = await this.context.globalState.get(
      AUTOBE_CHAT_SESSION_MAP,
    );
    (
      chatSessionMap as
        | Array<
            [
              string,
              {
                history: AutoBeHistory[];
                tokenUsage: IAutoBeTokenUsageJson;
              },
            ]
          >
        | undefined
    )?.forEach(([sessionId, session]) => {
      this.chatSessionMap.set(sessionId, session);
    });
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
        const sessionId = await this.createChatSession();
        await this.webview.postMessage({
          type: "res_create_chat_session",
          data: sessionId,
        });

        await this.conversate(sessionId, message.data.message);
        break;
    }
  }

  private async createChatSession() {
    const sessionId = "123123123";
    return sessionId;
  }

  private async conversate(sessionId: string, message: string) {
    const session = this.chatSessionMap.get(sessionId);

    const config = this.config;
    if (config?.apiKey === undefined) {
      throw new Error("Config is not initialized");
    }

    const agent = (() => {
      const defaultConfig = {
        model: this.config?.model ?? "chatgpt",
        vendor: {
          api: new OpenAI({
            apiKey: this.config?.apiKey ?? "",
            baseURL: this.config?.baseUrl ?? "",
          }),
          model: this.config?.model ?? "gpt-4.1",
          semaphore: Number(this.config?.concurrencyRequest ?? "16"),
        },
        compiler: (listener) => new AutoBeCompiler(listener),
      } satisfies IAutoBeProps<ILlmSchema.Model>;
      if (session !== undefined) {
        return new AutoBeAgent({
          ...defaultConfig,
          histories: session.history,
          tokenUsage: session.tokenUsage,
        });
      }
      return new AutoBeAgent(defaultConfig);
    })();
    // this.registerAutoBeEventHandler(agent);
    const result = await agent.conversate(message);

    this.chatSessionMap.set(sessionId, {
      history: agent.getHistories(),
      tokenUsage: agent.getTokenUsage(),
    });

    return result;
  }

  // private registerAutoBeEventHandler(agent: AutoBeAgent<ILlmSchema.Model>) {
  //   AUTOBE_EVENT_TYPES.forEach((key) => {
  //     agent.on(key, (ev) => {
  //       this.webview.postMessage({
  //         type: "on_event_auto_be",
  //         data: ev,
  //       });
  //     });
  //   });
  //   return agent;
  // }
}
