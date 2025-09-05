import jwt from "jsonwebtoken";

import { AutoBeHackathonGlobal } from "../AutoBeHackathonGlobal";

export namespace JwtTokenManager {
  export type Type = "access" | "refresh";
  export interface IProps {
    table: string;
    id: string;
    readonly: boolean;
    expired_at?: string;
    refreshable_until?: string;
  }
  export type IAsset = Required<IProps>;
  export interface IOutput extends IAsset {
    access: string;
    refresh: string;
  }

  export const generate = async (props: IProps): Promise<IOutput> => {
    const asset: IAsset = {
      table: props.table,
      id: props.id,
      readonly: props.readonly,
      expired_at:
        props.expired_at ??
        new Date(Date.now() + Expirations.ACCESS).toISOString(),
      refreshable_until:
        props.refreshable_until ??
        new Date(Date.now() + Expirations.REFRESH).toISOString(),
    };
    const [access, refresh] = [
      AutoBeHackathonGlobal.env().HACKATHON_JWT_SECRET_KEY,
      AutoBeHackathonGlobal.env().HACKATHON_JWT_REFRESH_KEY,
    ].map((key) => jwt.sign(asset, key));
    return {
      ...asset,
      access,
      refresh,
    };
  };

  export const verify =
    (type: Type) =>
    async (token: string): Promise<IAsset> => {
      return jwt.verify(
        token,
        type === "access"
          ? AutoBeHackathonGlobal.env().HACKATHON_JWT_SECRET_KEY
          : AutoBeHackathonGlobal.env().HACKATHON_JWT_REFRESH_KEY,
      ) as IAsset;
    };

  const enum Duration {
    HOUR = 60 * 60 * 1000,
    DAY = 24 * HOUR,
    WEEK = 7 * DAY,
  }
  export const enum Expirations {
    ACCESS = 3 * Duration.DAY,
    REFRESH = 2 * Duration.WEEK,
  }
}
