import {
  IAutoBeHackathon,
  IAutobeHackathonParticipant,
} from "@autobe/hackathon-api";
import { ForbiddenException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { v7 } from "uuid";

import { AutoBeHackathonGlobal } from "../AutoBeHackathonGlobal";
import { BcryptUtil } from "../utils/BcryptUtil";
import { JwtTokenManager } from "../utils/JwtTokenManager";

export namespace AutoBeHackathonParticipantProvider {
  export namespace json {
    export const transform = (
      input: Prisma.autobe_hackathon_participantsGetPayload<
        ReturnType<typeof select>
      >,
    ): IAutobeHackathonParticipant => ({
      id: input.id,
      email: input.email,
      name: input.name,
      created_at: input.created_at.toISOString(),
    });
    export const select = () =>
      ({}) satisfies Prisma.autobe_hackathon_participantsFindManyArgs;
  }

  export const authorize = async (props: {
    hackathon: IAutoBeHackathon;
    accessToken: string | null | undefined;
  }): Promise<IAutobeHackathonParticipant> => {
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
      await AutoBeHackathonGlobal.prisma.autobe_hackathon_participants.findFirst(
        {
          where: {
            autobe_hackathon_id: props.hackathon.id,
            id: decoded.id,
          },
          ...json.select(),
        },
      );
    if (record === null) throw new ForbiddenException("Participant not found.");
    return json.transform(record);
  };

  export const login = async (props: {
    hackathon: IAutoBeHackathon;
    body: IAutobeHackathonParticipant.ILogin;
  }): Promise<IAutobeHackathonParticipant.IAuthorized> => {
    const record =
      await AutoBeHackathonGlobal.prisma.autobe_hackathon_participants.findFirst(
        {
          where: {
            autobe_hackathon_id: props.hackathon.id,
            email: props.body.email,
          },
          ...json.select(),
        },
      );
    if (record === null) throw new ForbiddenException("Email not registered.");
    else if (
      false ===
      (await BcryptUtil.equals({
        input: props.body.password,
        hashed: record.password,
      }))
    )
      throw new ForbiddenException("Invalid password.");
    return await tokenize(json.transform(record));
  };

  export const refresh = async (props: {
    hackathon: IAutoBeHackathon;
    body: IAutobeHackathonParticipant.IRefresh;
  }): Promise<IAutobeHackathonParticipant.IAuthorized> => {
    const decoded: JwtTokenManager.IAsset = await JwtTokenManager.verify(
      "refresh",
    )(props.body.value);
    if (decoded.table !== TABLE_NAME)
      throw new ForbiddenException("Invalid token.");
    const record =
      await AutoBeHackathonGlobal.prisma.autobe_hackathon_participants.findFirst(
        {
          where: {
            autobe_hackathon_id: props.hackathon.id,
            id: decoded.id,
          },
          ...json.select(),
        },
      );
    if (record === null) throw new ForbiddenException("Participant not found.");
    return await tokenize(json.transform(record));
  };

  export const join = async (props: {
    hackathon: IAutoBeHackathon;
    body: IAutobeHackathonParticipant.IJoin;
  }): Promise<IAutobeHackathonParticipant.IAuthorized> => {
    const existing =
      await AutoBeHackathonGlobal.prisma.autobe_hackathon_participants.findFirst(
        {
          where: {
            autobe_hackathon_id: props.hackathon.id,
            email: props.body.email,
          },
          select: { id: true },
        },
      );
    if (existing !== null)
      throw new ForbiddenException("Email already registered.");

    const record =
      await AutoBeHackathonGlobal.prisma.autobe_hackathon_participants.create({
        data: {
          id: v7(),
          autobe_hackathon_id: props.hackathon.id,
          email: props.body.email,
          name: props.body.name,
          password: await BcryptUtil.hash(props.body.password),
          created_at: new Date(),
        },
        ...json.select(),
      });
    return await tokenize(json.transform(record));
  };

  const tokenize = async (
    participant: IAutobeHackathonParticipant,
  ): Promise<IAutobeHackathonParticipant.IAuthorized> => {
    const token: JwtTokenManager.IOutput = await JwtTokenManager.generate({
      table: TABLE_NAME,
      id: participant.id,
      readonly: false,
    });
    return {
      ...participant,
      token: {
        access: token.access,
        refresh: token.refresh,
        expired_at: token.expired_at,
        refreshable_until: token.refreshable_until,
      },
    };
  };
}

const TABLE_NAME = "autobe_hackathon_participants";
const BEARER_PREFIX: string = "Bearer ";
