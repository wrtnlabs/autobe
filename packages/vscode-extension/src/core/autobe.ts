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
import { ExtensionContext, Uri, Webview, workspace } from "vscode";

import { Logger } from "../Logger";
import {
  AUTOBE_API_KEY,
  AUTOBE_CHAT_SESSION_MAP,
  AUTOBE_CONFIG,
} from "../constant/key";

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

export class AutoBeWrapper {
  private readonly webview: Webview;
  private readonly context: ExtensionContext;
  public config: Partial<IResponseGetConfig["data"]> = {};

  private readonly chatSessionMap: Map<string, Session> = new Map();

  constructor(webview: Webview, context: ExtensionContext) {
    this.webview = webview;
    this.context = context;
  }

  public async initialize() {
    const chatSessionMap = typia.json.assertParse<
      Array<{
        sessionId: string;
        history: AutoBeHistory[];
        tokenUsage: IAutoBeTokenUsageJson;
      }>
    >((await this.context.globalState.get(AUTOBE_CHAT_SESSION_MAP)) ?? "[]");
    chatSessionMap.forEach((session) => {
      this.chatSessionMap.set(session.sessionId, session);
    });
    Logger.debug(
      `AutoBeWrapper initialize: ${(chatSessionMap as any)?.length}`,
    );
    await this.updateConfig(undefined, {});
  }

  private async save() {
    await this.context.globalState.update(
      AUTOBE_CHAT_SESSION_MAP,
      typia.json.assertStringify(
        Array.from(this.chatSessionMap.entries()).map(
          ([sessionId, session]) => ({
            sessionId,
            history: session.history,
            tokenUsage: session.tokenUsage,
          }),
        ),
      ),
    );
  }

  public async dispose() {
    await this.save();
    this.chatSessionMap.forEach((session) => {
      session.agent?.close();
    });
    this.chatSessionMap.clear();
  }

  private async postMessage(message: IAutoBeWebviewMessage) {
    Logger.debug(`[AutoBe] postMessage: ${JSON.stringify(message)}`);
    await this.webview.postMessage(message);
  }

  private async updateConfig(
    apiKey: string | undefined,
    restConfig: Partial<IResponseGetConfig["data"]>,
  ) {
    if (apiKey !== undefined) {
      await this.context.secrets.store(AUTOBE_API_KEY, apiKey);
      this.config.apiKey = apiKey;
    }
    const existingConfig = (await this.context.globalState.get(
      AUTOBE_CONFIG,
    )) as Partial<IResponseGetConfig["data"]> | undefined;

    const mergedConfig = {
      ...existingConfig,
      ...restConfig,
      apiKey: await this.context.secrets.get(AUTOBE_API_KEY),
    };
    await this.context.globalState.update(AUTOBE_CONFIG, mergedConfig);
    this.config = mergedConfig;
  }

  public async handlePostMessage(message: IAutoBeWebviewMessage) {
    switch (message.type) {
      case "req_get_config": {
        await this.postMessage({
          type: "res_get_config",
          data: this.config,
        });
        break;
      }
      case "req_set_config": {
        const { apiKey, ...restConfig } = message.data;
        await this.updateConfig(apiKey, restConfig);
        break;
      }
      case "req_create_chat_session": {
        const session = await this.createChatSession();
        await this.postMessage({
          type: "res_create_chat_session",
          data: {
            sessionId: session.sessionId,
          },
        });

        await this.conversate({
          session,
          message: message.data.message,
        });
        break;
      }
      case "req_conversate_chat_session": {
        const session = this.chatSessionMap.get(message.data.sessionId);
        if (session === undefined) {
          throw new Error("Session not found");
        }
        await this.conversate({
          session,
          message: message.data.message,
        });
        break;
      }
      case "req_save_files": {
        const wsDirectory = await workspace.workspaceFolders?.[0];
        if (wsDirectory === undefined) {
          await this.postMessage({
            type: "res_save_files",
            data: {
              success: false,
              error: "Workspace directory not found",
            },
          });
          return;
        }

        const directory = Uri.joinPath(wsDirectory.uri, message.data.directory);
        await workspace.fs.createDirectory(directory);

        await Promise.all(
          Object.entries(message.data.files).map(([filename, content]) => {
            return workspace.fs.writeFile(
              Uri.joinPath(directory, filename),
              Buffer.from(content, "utf-8"),
            );
          }),
        ).catch(async (e) => {
          await this.postMessage({
            type: "res_save_files",
            data: {
              success: false,
              error: e instanceof Error ? e.message : "Unknown error",
            },
          });
          throw e;
        });

        await this.postMessage({
          type: "res_save_files",
          data: {
            success: true,
          },
        });
        return;
      }
      case "req_remove_session": {
        this.chatSessionMap.delete(message.data.sessionId);
        await this.save();
        return;
      }
      case "req_get_session_list": {
        const sessionList = Array.from(this.chatSessionMap.entries()).map(
          ([sessionId, session]) => ({
            lastConversation:
              session.history.find((v) => "text" in v)?.text ?? "",
            updatedAt: new Date(
              session.history[session.history.length - 1].created_at,
            ).valueOf(),
            sessionId,
            tokenUsage: {
              inputTokens: session.tokenUsage.aggregate.input.total,
              outputTokens: session.tokenUsage.aggregate.output.total,
              totalTokens: session.tokenUsage.aggregate.total,
            },
          }),
        );
        sessionList.sort((a, b) => b.updatedAt - a.updatedAt);
        await this.postMessage({
          type: "res_get_session_list",
          data: {
            sessionList,
          },
        });
        return;
      }

      case "req_get_session_detail": {
        const session = this.chatSessionMap.get(message.data.sessionId);
        if (session === undefined) {
          throw new Error("Session not found");
        }
        await this.postMessage({
          type: "res_get_session_detail",
          data: {
            sessionId: session.sessionId,
            history: session.history,
            tokenUsage: session.tokenUsage,
          },
        });
        return;
      }
    }
  }

  private async createChatSession() {
    const session = {
      sessionId: crypto.randomUUID(),
      history: [],
      tokenUsage: new AutoBeTokenUsage().toJSON(),
    } satisfies Session;
    this.chatSessionMap.set(session.sessionId, session);
    return session;
  }

  private async conversate(props: { session: Session; message: string }) {
    if (this.config?.apiKey === undefined) {
      Logger.debug(JSON.stringify(this.config));
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
        model:
          this.config?.model == null || this.config.model === ""
            ? "gpt-4.1"
            : this.config.model,
        schemaModel: "chatgpt",
        baseUrl: this.config?.baseUrl ?? "",
        concurrencyRequest: Number(this.config?.concurrencyRequest ?? "16"),
      },
      typia.misc.literals<keyof IAutoBeRpcListener>().reduce(
        (acc, cur) => ({
          ...acc,
          [cur]: async (message: AutoBeEvent) => {
            await this.postMessage({
              type: "on_event_auto_be",
              sessionId: props.session.sessionId,
              data: message,
            });

            props.session.tokenUsage = await props.session
              .agent!.getDriver()
              .getTokenUsage();

            await this.postMessage({
              type: "on_event_update_token_usage",
              sessionId: props.session.sessionId,
              data: props.session.tokenUsage,
            });
            await this.save();
          },
        }),
        {} as IAutoBeRpcListener,
      ),
    );

    await props.session.agent.connect(
      `${this.context.extensionUri}/worker/dist/index.mjs`.slice(7),
    );
    const history = await props.session.agent
      .getDriver()
      .conversate(props.message);
    props.session.history.push(...history);
  }
}
