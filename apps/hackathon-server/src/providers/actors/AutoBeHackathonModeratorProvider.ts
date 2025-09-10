import {
  IAutoBeHackathon,
  IAutoBeHackathonModerator,
  IAutoBeHackathonParticipant,
} from "@autobe/interface";
import { ForbiddenException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { AutoBeHackathonGlobal } from "../../AutoBeHackathonGlobal";
import { BcryptUtil } from "../../utils/BcryptUtil";
import { JwtTokenManager } from "../../utils/JwtTokenManager";

export namespace AutoBeHackathonModeratorProvider {
  export namespace json {
    export const transform = (
      input: Prisma.autobe_hackathon_moderatorsGetPayload<
        ReturnType<typeof select>
      >,
    ): IAutoBeHackathonModerator => ({
      type: "moderator",
      id: input.id,
      email: input.participant.email,
      name: input.participant.name,
      created_at: input.created_at.toISOString(),
    });
    export const select = () =>
      ({
        include: {
          participant: true,
        },
      }) satisfies Prisma.autobe_hackathon_moderatorsFindManyArgs;
  }

  export const authorize = async (props: {
    hackathon: IAutoBeHackathon;
    accessToken: string | null | undefined;
  }): Promise<IAutoBeHackathonModerator> => {
    if (!props.accessToken?.length)
      throw new ForbiddenException("Access token is required.");
    else if (props.accessToken.startsWith(BEARER_PREFIX) === false)
      throw new ForbiddenException("Access token is malformed.");

    const token: string = props.accessToken.substring(BEARER_PREFIX.length);
    const decoded: JwtTokenManager.IAsset =
      await JwtTokenManager.verify("access")(token);
    if (decoded.table !== TABLE_NAME)
      throw new ForbiddenException("Invalid access token.");

    const record =
      await AutoBeHackathonGlobal.prisma.autobe_hackathon_moderators.findFirst({
        where: {
          id: decoded.id,
          participant: {
            autobe_hackathon_id: props.hackathon.id,
          },
        },
        ...json.select(),
      });
    if (record === null) throw new ForbiddenException("Moderator not found.");
    return json.transform(record);
  };

  export const login = async (props: {
    hackathon: IAutoBeHackathon;
    body: IAutoBeHackathonModerator.ILogin;
  }): Promise<IAutoBeHackathonModerator.IAuthorized> => {
    const record =
      await AutoBeHackathonGlobal.prisma.autobe_hackathon_moderators.findFirst({
        where: {
          participant: {
            autobe_hackathon_id: props.hackathon.id,
            email: props.body.email,
          },
        },
        ...json.select(),
      });
    if (record === null) throw new ForbiddenException("Email not registered.");
    else if (
      false ===
      (await BcryptUtil.equals({
        input: props.body.password,
        hashed: record.participant.password,
      }))
    )
      throw new ForbiddenException("Invalid password.");
    return await tokenize(json.transform(record));
  };

  export const refresh = async (props: {
    hackathon: IAutoBeHackathon;
    body: IAutoBeHackathonModerator.IRefresh;
  }): Promise<IAutoBeHackathonModerator.IAuthorized> => {
    const decoded: JwtTokenManager.IAsset = await JwtTokenManager.verify(
      "refresh",
    )(props.body.value);
    if (decoded.table !== TABLE_NAME)
      throw new ForbiddenException("Invalid token.");
    const record =
      await AutoBeHackathonGlobal.prisma.autobe_hackathon_moderators.findFirst({
        where: {
          id: decoded.id,
          participant: {
            autobe_hackathon_id: props.hackathon.id,
          },
        },
        ...json.select(),
      });
    if (record === null) throw new ForbiddenException("Moderator not found.");
    return await tokenize(json.transform(record));
  };

  export const join = async (props: {
    hackathon: IAutoBeHackathon;
    participant: IAutoBeHackathonParticipant;
  }): Promise<IAutoBeHackathonModerator.IAuthorized> => {
    const existing =
      await AutoBeHackathonGlobal.prisma.autobe_hackathon_moderators.findFirst({
        where: {
          id: props.participant.id,
        },
        select: { id: true },
      });
    if (existing !== null)
      throw new ForbiddenException("Email already registered.");

    const record =
      await AutoBeHackathonGlobal.prisma.autobe_hackathon_moderators.create({
        data: {
          id: props.participant.id,
          created_at: new Date(),
          updated_at: new Date(),
          deleted_at: null,
        },
        ...json.select(),
      });
    return await tokenize(json.transform(record));
  };

  const tokenize = async (
    moderator: IAutoBeHackathonModerator,
  ): Promise<IAutoBeHackathonModerator.IAuthorized> => {
    const token: JwtTokenManager.IOutput = await JwtTokenManager.generate({
      table: TABLE_NAME,
      id: moderator.id,
      readonly: false,
    });
    return {
      ...moderator,
      token: {
        access: token.access,
        refresh: token.refresh,
        expired_at: token.expired_at,
        refreshable_until: token.refreshable_until,
      },
      setHeaders: {
        Authorization: `${BEARER_PREFIX}${token.access}`,
      },
    };
  };
}

const TABLE_NAME = "autobe_hackathon_moderators";
const BEARER_PREFIX: string = "Bearer ";
