import { ILlmSchema } from "@samchon/openapi";

export type IAutoBeWebviewMessage =
  | IRequestInitWebview
  | IRequestGetConfig
  | IResponseGetConfig
  | IRequestSetConfig
  | IRequestCreateChatSession
  | IResponseCreateChatSession;

export interface IRequestInitWebview {
  type: "req_init_webview";
  data: {
    apiKey: string;
  };
}

export interface IRequestGetConfig {
  type: "req_get_api_key";
}

export interface IResponseGetConfig {
  type: "res_get_api_key";
  data: {
    apiKey: string;
    model: ILlmSchema.Model;
    baseUrl: string;
    concurrencyRequest: number;
  };
}

export interface IRequestSetConfig {
  type: "req_set_config";
  data: Partial<{
    apiKey: string;
    model: string;
    baseUrl: string;
    concurrencyRequest: number;
  }>;
}

export interface IRequestCreateChatSession {
  type: "req_create_chat_session";
  data: {
    message: string;
  };
}

export interface IResponseCreateChatSession {
  type: "res_create_chat_session";
  data: {
    sessionId: string;
  };
}

export interface IOnEventAutoBe {
  type: "on_event_auto_be";
  data: "";
}
