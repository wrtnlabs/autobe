export interface IRequestRemoveSession {
  type: "req_remove_session";
  data: {
    sessionId: string;
  };
}
