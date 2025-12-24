import { AutoBeHistory, AutoBeUserConversateContent } from "@autobe/interface";

export interface IRequestConversateChatSession {
  type: "req_conversate_chat_session";
  data: {
    sessionId: string;
    message:
      | string
      | AutoBeUserConversateContent
      | AutoBeUserConversateContent[];
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
