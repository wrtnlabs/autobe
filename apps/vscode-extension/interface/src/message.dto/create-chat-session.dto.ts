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
