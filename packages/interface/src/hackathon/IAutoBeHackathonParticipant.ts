import { tags } from "typia";

import { IAuthorizationToken } from "./IAuthorizationToken";
import { IAutoBeHackathonSession } from "./IAutoBeHackathonSession";

export interface IAutoBeHackathonParticipant {
  type: "participant";
  id: string & tags.Format<"uuid">;
  email: string & tags.Format<"email">;
  name: string;
  created_at: string & tags.Format<"date-time">;
}
export namespace IAutoBeHackathonParticipant {
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
  export interface IAuthorized extends IAutoBeHackathonParticipant {
    token: IAuthorizationToken;
    setHeaders: {
      Authorization: string;
    };
  }

  export interface ISummary extends IAutoBeHackathonParticipant {
    sessions: IAutoBeHackathonSession.ISummary[];
  }
}
