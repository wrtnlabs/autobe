import {
  AutoBeEvent,
  AutoBeHistory,
  IAutoBeTokenUsageJson,
} from "@autobe/interface";

export type IAutoBeWebviewMessage =
  | IRequestGetConfig
  | IResponseGetConfig
  | IRequestSetConfig
  | IRequestCreateChatSession
  | IResponseCreateChatSession
  | IOnHistoryAutoBe
  | IOnEventAutoBe
  | IOnEventUpdateTokenUsage
  | IRequestConversateChatSession
  | IActionToConfig;

export interface IRequestGetConfig {
  type: "req_get_api_key";
}

export interface IResponseGetConfig {
  type: "res_get_api_key";
  data: {
    apiKey: string;
    model: string;
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

export interface IRequestConversateChatSession {
  type: "req_conversate_chat_session";
  data: {
    sessionId: string;
    message: string;
  };
}

export interface IOnHistoryAutoBe {
  type: "on_history_auto_be";
  sessionId: string;
  data: AutoBeHistory;
}
export interface IOnEventAutoBe {
  type: "on_event_auto_be";
  sessionId: string;
  data: AutoBeEvent;
}

export interface IOnEventUpdateTokenUsage {
  type: "on_event_update_token_usage";
  sessionId: string;
  data: IAutoBeTokenUsageJson;
}

export interface IActionToConfig {
  type: "action_to_config";
}
