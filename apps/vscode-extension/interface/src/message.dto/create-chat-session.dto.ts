import { AutoBeHistory, AutoBeUserMessageContent } from "@autobe/interface";

export interface IRequestCreateChatSession {
  type: "req_create_chat_session";
  data: {
    message: string | AutoBeUserMessageContent | AutoBeUserMessageContent[];
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
