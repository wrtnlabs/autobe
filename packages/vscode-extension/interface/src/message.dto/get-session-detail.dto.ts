import { AutoBeHistory, IAutoBeTokenUsageJson } from "@autobe/interface";

export interface IRequestGetSessionDetail {
  type: "req_get_session_detail";
  data: {
    sessionId: string;
  };
}

export interface IResponseGetSessionDetail {
  type: "res_get_session_detail";
  data: {
    sessionId: string;
    history: Array<AutoBeHistory>;
    tokenUsage: IAutoBeTokenUsageJson;
  };
}
