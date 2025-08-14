export interface IRequestGetSessionList {
  type: "req_get_session_list";
}

export interface IResponseGetSessionList {
  type: "res_get_session_list";
  data: {
    sessionList: {
      lastConversation: string;
      updatedAt: number;
      sessionId: string;
      tokenUsage: {
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
      };
    }[];
  };
}
