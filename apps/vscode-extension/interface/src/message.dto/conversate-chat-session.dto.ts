export interface IRequestConversateChatSession {
  type: "req_conversate_chat_session";
  data: {
    sessionId: string;
    message: string;
  };
}
