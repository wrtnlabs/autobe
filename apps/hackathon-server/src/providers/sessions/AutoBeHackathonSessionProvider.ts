import { AutoBeTokenUsage } from "@autobe/agent";
import {
  AutoBeHackathonModel,
  AutoBePhase,
  IAutoBeHackathon,
  IAutoBeHackathonParticipant,
  IAutoBeHackathonSession,
  IPage,
} from "@autobe/interface";
import { Prisma } from "@prisma/client";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeHackathonGlobal } from "../../AutoBeHackathonGlobal";
import { IEntity } from "../../structures/IEntity";
import { PaginationUtil } from "../../utils/PaginationUtil";
import { AutoBeHackathonParticipantProvider } from "../actors/AutoBeHackathonParticipantProvider";
import { AutoBeHackathonSessionEventProvider } from "./AutoBeHackathonSessionEventProvider";
import { AutoBeHackathonSessionHistoryProvider } from "./AutoBeHackathonSessionHistoryProvider";

export namespace AutoBeHackathonSessionProvider {
  export namespace json {
    export const transform = (
      input: Prisma.autobe_hackathon_sessionsGetPayload<
        ReturnType<typeof select>
      >,
    ): IAutoBeHackathonSession => ({
      id: input.id,
      participant: AutoBeHackathonParticipantProvider.json.transform(
        input.participant,
      ),
      title: input.title ?? null,
      model: typia.assert<AutoBeHackathonModel>(input.model),
      timezone: input.timezone,
      phase: typia.assert<AutoBePhase | null>(input.aggregate!.phase),
      token_usage: JSON.parse(input.aggregate!.token_usage),
      histories: input.histories.map(
        AutoBeHackathonSessionHistoryProvider.json.transform,
      ),
      event_snapshots: input.events.map(
        AutoBeHackathonSessionEventProvider.json.transform,
      ),
      review_article_url: input.review_article_url,
      created_at: input.created_at.toISOString(),
      completed_at: input.completed_at?.toISOString() ?? null,
    });
    export const select = () =>
      ({
        include: {
          participant: AutoBeHackathonParticipantProvider.json.select(),
          histories: AutoBeHackathonSessionHistoryProvider.json.select(),
          events: AutoBeHackathonSessionEventProvider.json.select(),
          aggregate: true,
        },
      }) satisfies Prisma.autobe_hackathon_sessionsFindManyArgs;
  }
  export namespace summarize {
    export const transform = (
      input: Prisma.autobe_hackathon_sessionsGetPayload<
        ReturnType<typeof select>
      >,
    ): IAutoBeHackathonSession.ISummary => ({
      id: input.id,
      participant: AutoBeHackathonParticipantProvider.json.transform(
        input.participant,
      ),
      title: input.title ?? null,
      model: typia.assert<AutoBeHackathonModel>(input.model),
      timezone: input.timezone,
      phase: typia.assert<AutoBePhase | null>(input.aggregate!.phase),
      review_article_url: input.review_article_url,
      token_usage: JSON.parse(input.aggregate!.token_usage),
      created_at: input.created_at.toISOString(),
      completed_at: input.completed_at?.toISOString() ?? null,
    });
    export const select = () =>
      ({
        include: {
          participant: AutoBeHackathonParticipantProvider.json.select(),
          aggregate: true,
        },
      }) satisfies Prisma.autobe_hackathon_sessionsFindManyArgs;
  }

  export const index = (props: {
    hackathon: IAutoBeHackathon;
    participant: IAutoBeHackathonParticipant | null;
    body: IPage.IRequest;
  }): Promise<IPage<IAutoBeHackathonSession.ISummary>> =>
    PaginationUtil.paginate({
      schema: AutoBeHackathonGlobal.prisma.autobe_hackathon_sessions,
      payload: summarize.select(),
      transform: summarize.transform,
    })({
      where: {
        autobe_hackathon_id: props.hackathon.id,
        autobe_hackathon_participant_id: props.participant?.id ?? undefined,
        deleted_at: null,
      },
      orderBy: [
        {
          created_at: "desc",
        },
      ],
    } satisfies Prisma.autobe_hackathon_sessionsFindManyArgs)(props.body);

  export const find = async <
    Payload extends Prisma.autobe_hackathon_sessionsFindFirstArgs,
  >(props: {
    hackathon: IAutoBeHackathon;
    participant: IAutoBeHackathonParticipant | null;
    id: string;
    payload: Payload;
  }) => {
    const record =
      await AutoBeHackathonGlobal.prisma.autobe_hackathon_sessions.findFirstOrThrow(
        {
          where: {
            autobe_hackathon_id: props.hackathon.id,
            autobe_hackathon_participant_id: props.participant?.id ?? undefined,
            id: props.id,
            deleted_at: null,
          },
          ...props.payload,
        },
      );
    return record as Prisma.autobe_hackathon_sessionsGetPayload<Payload>;
  };

  export const at = async (props: {
    hackathon: IAutoBeHackathon;
    participant: IAutoBeHackathonParticipant | null;
    id: string;
  }): Promise<IAutoBeHackathonSession> => {
    const record = await find({
      hackathon: props.hackathon,
      participant: props.participant,
      id: props.id,
      payload: json.select(),
    });
    return json.transform(record);
  };

  export const create = async (props: {
    hackathon: IEntity;
    participant: IEntity;
    body: IAutoBeHackathonSession.ICreate;
  }): Promise<IAutoBeHackathonSession> => {
    const record =
      await AutoBeHackathonGlobal.prisma.autobe_hackathon_sessions.create({
        data: {
          id: v7(),
          autobe_hackathon_id: props.hackathon.id,
          autobe_hackathon_participant_id: props.participant.id,
          model: props.body.model,
          timezone: props.body.timezone,
          title: props.body.title ?? null,
          created_at: new Date(),
          completed_at: null,
          review_article_url: null,
          aggregate: {
            create: {
              id: v7(),
              phase: null,
              enabled: true,
              token_usage: JSON.stringify(new AutoBeTokenUsage().toJSON()),
            },
          },
        },
        ...json.select(),
      });
    return json.transform(record);
  };

  export const update = async (props: {
    hackathon: IAutoBeHackathon;
    participant: IAutoBeHackathonParticipant;
    id: string;
    body: IAutoBeHackathonSession.IUpdate;
  }): Promise<void> => {
    await find({
      hackathon: props.hackathon,
      participant: props.participant,
      id: props.id,
      payload: { select: { id: true } },
    });
    await AutoBeHackathonGlobal.prisma.autobe_hackathon_sessions.update({
      where: { id: props.id },
      data: {
        title: props.body.title,
      },
    });
  };

  export const review = async (props: {
    hackathon: IAutoBeHackathon;
    participant: IAutoBeHackathonParticipant;
    id: string;
    body: IAutoBeHackathonSession.IReview;
  }): Promise<void> => {
    await find({
      hackathon: props.hackathon,
      participant: props.participant,
      id: props.id,
      payload: { select: { id: true } },
    });
    await AutoBeHackathonGlobal.prisma.autobe_hackathon_sessions.update({
      where: { id: props.id },
      data: {
        review_article_url: props.body.review_article_url,
        completed_at: new Date(),
      },
    });
  };

  export const erase = async (props: {
    hackathon: IAutoBeHackathon;
    participant: IAutoBeHackathonParticipant;
    id: string;
  }): Promise<void> => {
    await find({
      hackathon: props.hackathon,
      participant: props.participant,
      id: props.id,
      payload: { select: { id: true } },
    });
    await AutoBeHackathonGlobal.prisma.autobe_hackathon_sessions.update({
      where: { id: props.id },
      data: {
        deleted_at: new Date(),
      },
    });
  };
}
