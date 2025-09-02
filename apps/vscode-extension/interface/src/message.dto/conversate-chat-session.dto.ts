import { AutoBeHistory, AutoBeUserMessageContent } from "@autobe/interface";

export interface IRequestConversateChatSession {
  type: "req_conversate_chat_session";
  data: {
    sessionId: string;
    message: string | AutoBeUserMessageContent | AutoBeUserMessageContent[];
    nonce: string;
  };
}

export interface IResponseConversateChatSession {
  type: "res_conversate_chat_session";
  data: {
    sessionId: string;
    history: Array<AutoBeHistory>;
    nonce: string;
  };
}
