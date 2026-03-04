import { tags } from "typia";

import { IAuthorizationToken } from "./IAuthorizationToken";
import { ISetAuthorizationHeaders } from "./ISetAuthorizationHeaders";

export interface IAutoBeHackathonModerator {
  type: "moderator";
  id: string & tags.Format<"uuid">;
  email: string & tags.Format<"email">;
  name: string;
  created_at: string & tags.Format<"date-time">;
}
export namespace IAutoBeHackathonModerator {
  export interface ILogin {
    email: string & tags.Format<"email">;
    password: string;
  }
  export interface IRefresh extends ILogin {
    value: string;
  }
  export interface IAuthorized extends IAutoBeHackathonModerator {
    token: IAuthorizationToken;
    setHeaders: ISetAuthorizationHeaders;
  }
}
