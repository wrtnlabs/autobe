import { tags } from "typia";

import { IAuthorizationToken } from "./IAuthorizationToken";

export interface IAutobeHackathonParticipant {
  id: string & tags.Format<"uuid">;
  email: string & tags.Format<"email">;
  name: string;
  created_at: string & tags.Format<"date-time">;
}
export namespace IAutobeHackathonParticipant {
  export interface IJoin {
    email: string & tags.Format<"email">;
    name: string;
    password: string;
  }
  export interface ILogin {
    email: string & tags.Format<"email">;
    password: string;
  }
  export interface IRefresh extends ILogin {
    value: string;
  }
  export interface IAuthorized extends IAutobeHackathonParticipant {
    token: IAuthorizationToken;
    setHeaders: {
      Authorization: string;
    };
  }
}
