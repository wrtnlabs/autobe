import { AutoBeHistory, AutoBeUserConversateContent } from "@autobe/interface";

export interface IRequestCreateChatSession {
  type: "req_create_chat_session";
  data: {
    message:
      | string
      | AutoBeUserConversateContent
      | AutoBeUserConversateContent[];
    nonce: string;
  };
}

export interface IResponseCreateChatSession {
  type: "res_create_chat_session";
  data: {
    sessionId: string;
    history: Array<AutoBeHistory>;
    nonce: string;
  };
}
